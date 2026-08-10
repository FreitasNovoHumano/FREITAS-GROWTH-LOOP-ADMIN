import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { participantSchema } from "@/modules/growth-loop/schemas/participant";
import { hashValue, normalizeEmail, normalizePhone, opaqueToken, referralCode } from "@/lib/security";
import { grantReward } from "@/modules/growth-loop/domain/reward-service";
import { notifyClient } from "@/lib/notifications";
import {
  publicCampaignClientIdSchema,
  publicCampaignWhere,
} from "@/lib/public-campaign";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params; const input = participantSchema.parse(await request.json());
    const requestedClientId = new URL(request.url).searchParams.get("clientId");
    const clientId = requestedClientId ? publicCampaignClientIdSchema.parse(requestedClientId) : undefined;
    const campaign = await prisma.growthLoopCampaign.findFirst({ where: publicCampaignWhere(slug, clientId), include: { rewards: { include: { ruleVersions: true } } } });
    if (!campaign) return NextResponse.json({ error: "Campanha indisponível" }, { status: 404 });
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await prisma.participant.findUnique({ where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } } });
    if (existing) return NextResponse.json({ error: "Este e-mail já participa da campanha" }, { status: 409 });
    const referrer = input.referralCode ? await prisma.participant.findUnique({ where: { referralCode: input.referralCode } }) : null;
    if (referrer?.normalizedEmail === normalizedEmail) return NextResponse.json({ error: "Autorreferência não permitida" }, { status: 409 });
    const accessToken = opaqueToken();
    const participant = await prisma.participant.create({ data: { clientId: campaign.clientId, campaignId: campaign.id, name: input.name, email: input.email, normalizedEmail, phone: input.phone, normalizedPhone: normalizePhone(input.phone), referralCode: referralCode(), accessTokenHash: hashValue(accessToken), status: "ACTIVE", registrationCompletedAt: new Date(), emailVerifiedAt: new Date(), consents: { create: [{ clientId: campaign.clientId, type: "TERMS", policyVersion: "1.0", granted: true, ipHash: hashValue(request.headers.get("x-forwarded-for") ?? "unknown"), userAgentHash: hashValue(request.headers.get("user-agent") ?? "unknown") }, { clientId: campaign.clientId, type: "PRIVACY", policyVersion: "1.0", granted: true }] } } });
    await prisma.lead.upsert({ where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } }, update: { convertedAt: new Date(), participantId: participant.id }, create: { clientId: campaign.clientId, campaignId: campaign.id, participantId: participant.id, name: input.name, email: input.email, normalizedEmail, phone: input.phone, convertedAt: new Date() } });
    if (referrer && referrer.campaignId === campaign.id) await prisma.referral.create({ data: { clientId: campaign.clientId, campaignId: campaign.id, referrerParticipantId: referrer.id, referredParticipantId: participant.id, status: "REGISTERED", registeredAt: new Date(), attributionKey: `${campaign.id}:${participant.id}`, ruleVersion: 1 } });
    const reward = campaign.rewards.find(r => r.key === "INITIAL"); const rule = reward?.ruleVersions[0];
    if (reward && rule) await grantReward({ clientId: campaign.clientId, campaignId: campaign.id, participantId: participant.id, rewardId: reward.id, ruleVersionId: rule.id, milestone: "REGISTRATION_COMPLETED" });
    await prisma.domainEvent.create({ data: { clientId: campaign.clientId, aggregateType: "Participant", aggregateId: participant.id, eventType: "ParticipantRegistered", idempotencyKey: `participant-registered:${participant.id}`, payload: { campaignId: campaign.id } } });
    await notifyClient({ clientId: campaign.clientId, eventKey: "lead.created", title: "Novo lead no Growth Loop", message: `${input.name} entrou pela campanha ${campaign.name}.`, type: "GROWTH_LOOP_LEAD", link: "/dashboard/leads" });
    return NextResponse.json({ participantId: participant.id, referralCode: participant.referralCode, accessToken }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível concluir" }, { status: 400 }); }
}
