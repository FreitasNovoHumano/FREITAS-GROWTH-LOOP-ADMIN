import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { participantSchema } from "@/modules/growth-loop/schemas/participant";
import { canonicalEmail, hashIp, hashValue, normalizeEmail, normalizePhone, opaqueToken, referralCode } from "@/lib/security";
import { grantReward } from "@/modules/growth-loop/domain/reward-service";
import { notifyClient } from "@/lib/notifications";
import {
  publicCampaignClientIdSchema,
  publicCampaignWhere,
} from "@/lib/public-campaign";

const MAX_JOINS_PER_IP = 30;
const JOIN_WINDOW_MS = 60 * 60_000;

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; const input = participantSchema.parse(await request.json());
    const requestedClientId = new URL(request.url).searchParams.get("clientId");
    const clientId = requestedClientId ? publicCampaignClientIdSchema.parse(requestedClientId) : undefined;
    const campaigns = await prisma.growthLoopCampaign.findMany({ where: publicCampaignWhere(slug, clientId), take: 2, include: { rewards: { include: { ruleVersions: true } } } });
    if (campaigns.length > 1) return NextResponse.json({ error: "Link incompleto. Use o link completo da campanha." }, { status: 409 });
    const campaign = campaigns[0];
    if (!campaign) return NextResponse.json({ error: "Campanha indisponível" }, { status: 404 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIp(ip);
    // Limite simples por IP (cadastros na última hora), usando os consentimentos já gravados.
    if (ip !== "unknown" && await prisma.consent.count({ where: { ipHash, type: "TERMS", occurredAt: { gte: new Date(Date.now() - JOIN_WINDOW_MS) } } }) >= MAX_JOINS_PER_IP) return NextResponse.json({ error: "Muitos cadastros a partir desta rede. Tente novamente mais tarde." }, { status: 429 });
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await prisma.participant.findUnique({ where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } } });
    if (existing) return NextResponse.json({ error: "Este e-mail já participa da campanha" }, { status: 409 });
    const referrer = input.referralCode ? await prisma.participant.findUnique({ where: { referralCode: input.referralCode } }) : null;
    if (referrer && canonicalEmail(referrer.normalizedEmail) === canonicalEmail(normalizedEmail)) return NextResponse.json({ error: "Autorreferência não permitida" }, { status: 409 });
    const accessToken = opaqueToken();
    // Gravações do cadastro em uma transação: ou tudo é salvo, ou nada.
    const participant = await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.create({ data: { clientId: campaign.clientId, campaignId: campaign.id, name: input.name, email: input.email, normalizedEmail, phone: input.phone, normalizedPhone: normalizePhone(input.phone), referralCode: referralCode(), accessTokenHash: hashValue(accessToken), status: "ACTIVE", registrationCompletedAt: new Date(), consents: { create: [{ clientId: campaign.clientId, type: "TERMS", policyVersion: "1.0", granted: true, ipHash, userAgentHash: hashValue(request.headers.get("user-agent") ?? "unknown") }, { clientId: campaign.clientId, type: "PRIVACY", policyVersion: "1.0", granted: true }] } } });
      await tx.lead.upsert({ where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } }, update: { convertedAt: new Date(), participantId: participant.id }, create: { clientId: campaign.clientId, campaignId: campaign.id, participantId: participant.id, name: input.name, email: input.email, normalizedEmail, phone: input.phone, convertedAt: new Date() } });
      if (referrer && referrer.campaignId === campaign.id) await tx.referral.create({ data: { clientId: campaign.clientId, campaignId: campaign.id, referrerParticipantId: referrer.id, referredParticipantId: participant.id, status: "REGISTERED", registeredAt: new Date(), attributionKey: `${campaign.id}:${participant.id}`, ruleVersion: 1 } });
      const reward = campaign.rewards.find(r => r.key === "INITIAL"); const rule = reward?.ruleVersions[0];
      if (reward && rule) await grantReward({ clientId: campaign.clientId, campaignId: campaign.id, participantId: participant.id, rewardId: reward.id, ruleVersionId: rule.id, milestone: "REGISTRATION_COMPLETED" }, tx);
      await tx.domainEvent.create({ data: { clientId: campaign.clientId, aggregateType: "Participant", aggregateId: participant.id, eventType: "ParticipantRegistered", idempotencyKey: `participant-registered:${participant.id}`, payload: { campaignId: campaign.id } } });
      return participant;
    });
    await notifyClient({ clientId: campaign.clientId, eventKey: "lead.created", title: "Novo lead no Growth Loop", message: `${input.name} entrou pela campanha ${campaign.name}.`, type: "GROWTH_LOOP_LEAD", link: "/dashboard/leads" });
    return NextResponse.json({ participantId: participant.id, referralCode: participant.referralCode, accessToken }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Revise os dados informados.", fields: error.flatten().fieldErrors }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Este e-mail já participa da campanha" }, { status: 409 });
    console.error("growth_loop_join_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Não foi possível concluir o cadastro. Tente novamente." }, { status: 500 });
  }
}
