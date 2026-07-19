import { Prisma } from "@prisma/client";
import { z } from "zod";
import { escapeHtml, sendTransactionalEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  hashValue,
  leadSlug,
  normalizeEmail,
  normalizePhone,
  opaqueToken,
  referralCode,
} from "@/lib/security";
import { grantReward } from "./reward-service";
import { participantSchema } from "../schemas/participant";
import { PRODUCTION_APP_ORIGIN } from "@/lib/app-url";
import { buildFirstRewardEmail } from "../email-templates/first-reward-email";
import { renderEmailTemplate } from "../email-templates/template-utils";

const emailSchema = z.string().trim().email("E-mail inválido").transform(normalizeEmail);
const leadSlugSchema = z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/, "Slug de lead inválido");
const whatsappSchema = z.string().trim().transform((value) => normalizePhone(value) ?? "").refine((value) => {
  const brazilianNumber = value.startsWith("55") ? value.slice(2) : value;
  return /^[1-9]{2}9?\d{8}$/.test(brazilianNumber);
}, "WhatsApp inválido");
const legacyRegisterSchema = z.object({
  lead_name: z.string().trim().min(2).max(120),
  lead_email: emailSchema,
  lead_whatsapp: whatsappSchema,
  invited_by_lead_slug: leadSlugSchema.optional(),
}).strict();

export class PublicCampaignError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "PublicCampaignError";
  }
}

function publicBaseUrl() {
  return (process.env.BASE_URL
    ?? process.env.GROWTH_LOOP_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? PRODUCTION_APP_ORIGIN).replace(/\/$/, "");
}

function templateUrl(campaignSlug: string) {
  return `${publicBaseUrl()}/growth-loop/${campaignSlug}`;
}

async function findCampaignBySlug(slug: string) {
  return prisma.growthLoopCampaign.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      page: true,
      rewards: { include: { ruleVersions: { orderBy: { version: "desc" } } } },
      templates: true,
    },
  });
}

type PublicCampaign = NonNullable<Awaited<ReturnType<typeof findCampaignBySlug>>>;

function emailTemplate(
  campaign: { templates: Array<{ key: string; subject: string; html: string }> },
  ...keys: string[]
) {
  return campaign.templates.find((item) => keys.includes(item.key));
}

async function sendCampaignEmail(input: Parameters<typeof sendTransactionalEmail>[0]) {
  try {
    return await sendTransactionalEmail(input);
  } catch (error) {
    console.error("Falha no transporte SMTP do Growth Loop:", error);
    throw new PublicCampaignError("Não foi possível enviar o e-mail transacional.", 502);
  }
}

export async function getPublicCampaign(slug: string) {
  const campaign = await findCampaignBySlug(slug);
  if (!campaign) throw new PublicCampaignError("Campanha indisponível", 404);
  const firstReward = campaign.rewards.find((item) => ["cadastro", "INITIAL", "FIRST"].includes(item.key));
  const secondReward = campaign.rewards.find((item) => ["indicacoes", "MILESTONE", "SECOND"].includes(item.key));
  const firstEmail = emailTemplate(campaign, "FIRST_REWARD", "INITIAL_REWARD");
  const secondEmail = emailTemplate(campaign, "SECOND_REWARD", "MILESTONE_REWARD");
  const inviteEmail = emailTemplate(campaign, "INVITE", "INVITATION");
  return {
    id: campaign.id,
    name: campaign.name,
    title: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    status: true,
    primaryColor: campaign.primaryColor,
    accentColor: campaign.accentColor,
    logoUrl: campaign.logoUrl,
    initialRewardTitle: campaign.initialRewardTitle,
    initialRewardValue: campaign.initialRewardValue,
    milestoneRewardTitle: campaign.milestoneRewardTitle,
    milestoneRewardValue: campaign.milestoneRewardValue,
    qualifiedReferralGoal: campaign.qualifiedReferralGoal,
    required_leads_for_second_reward: campaign.qualifiedReferralGoal,
    page: campaign.page,
    available_at: campaign.startsAt ?? campaign.createdAt,
    user_id: campaign.createdById,
    first_reward_title: campaign.initialRewardTitle,
    first_reward_text: firstReward?.description ?? campaign.initialRewardValue ?? "",
    first_reward_video_url: "",
    first_reward_how_it_works_title: "Como receber sua primeira recompensa",
    first_reward_how_it_works_text: campaign.page?.body ?? "Conclua seu cadastro para liberar o benefício inicial.",
    first_reward_how_it_works_img_url: campaign.page?.heroImageUrl ?? campaign.logoUrl ?? "",
    second_reward_title: campaign.milestoneRewardTitle,
    second_reward_subtitle: `Convide ${campaign.qualifiedReferralGoal} pessoas`,
    second_reward_text: secondReward?.description ?? campaign.milestoneRewardValue ?? "",
    second_reward_video_url: "",
    second_reward_invite_title: "Compartilhe com sua rede",
    second_reward_invite_text: `A recompensa é liberada quando ${campaign.qualifiedReferralGoal} convidados concluem a participação.`,
    thanks_title: campaign.page?.thankYouTitle ?? "Obrigado por participar!",
    thanks_text: campaign.page?.subheadline ?? "Seu cadastro foi concluído e sua recompensa inicial está disponível.",
    first_reward_email_title: firstEmail?.subject ?? `Seu bônus: ${campaign.initialRewardTitle}`,
    first_reward_email_text: firstEmail?.html ?? campaign.initialRewardValue ?? "",
    first_reward_email_link: firstReward?.claimUrl ?? templateUrl(campaign.slug),
    second_reward_email_title: secondEmail?.subject ?? `Recompensa desbloqueada: ${campaign.milestoneRewardTitle}`,
    second_reward_email_text: secondEmail?.html ?? campaign.milestoneRewardValue ?? "",
    second_reward_email_link: secondReward?.claimUrl ?? templateUrl(campaign.slug),
    invite_email_title: inviteEmail?.subject ?? `Você recebeu um convite para ${campaign.name}`,
    invite_email_reward: campaign.initialRewardTitle,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
  };
}

async function ensureParticipant(
  transaction: Prisma.TransactionClient,
  campaign: Pick<PublicCampaign, "id" | "clientId">,
  input: { name: string; email: string; phone?: string },
) {
  const existing = await transaction.participant.findUnique({
    where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail: input.email } },
  });
  if (existing) {
    const participant = await transaction.participant.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        phone: input.phone ?? existing.phone,
        normalizedPhone: input.phone ? normalizePhone(input.phone) : existing.normalizedPhone,
        status: "ACTIVE",
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        registrationCompletedAt: existing.registrationCompletedAt ?? new Date(),
      },
    });
    return { participant, accessToken: null, created: false };
  }
  const accessToken = opaqueToken();
  const participant = await transaction.participant.create({
    data: {
      clientId: campaign.clientId,
      campaignId: campaign.id,
      name: input.name,
      email: input.email,
      normalizedEmail: input.email,
      phone: input.phone,
      normalizedPhone: normalizePhone(input.phone),
      referralCode: referralCode(),
      accessTokenHash: hashValue(accessToken),
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      registrationCompletedAt: new Date(),
    },
  });
  return { participant, accessToken, created: true };
}

async function createUniqueLeadSlug(transaction: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = leadSlug();
    const exists = await transaction.lead.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new PublicCampaignError("Não foi possível gerar o identificador do lead.", 503);
}

export async function registerForCampaign(
  slug: string,
  rawInput: unknown,
  metadata: { forwardedFor?: string; userAgent?: string } = {},
) {
  const isLegacy = typeof rawInput === "object" && rawInput !== null && "lead_email" in rawInput;
  const input = isLegacy
    ? (() => {
        const parsed = legacyRegisterSchema.parse(rawInput);
        return {
          name: parsed.lead_name,
          email: parsed.lead_email,
          phone: parsed.lead_whatsapp,
          referralCode: undefined,
          invitedByLeadSlug: parsed.invited_by_lead_slug,
        };
      })()
    : (() => {
        const parsed = participantSchema.parse(rawInput);
        return {
          name: parsed.name,
          email: normalizeEmail(parsed.email),
          phone: parsed.phone,
          referralCode: parsed.referralCode,
          invitedByLeadSlug: parsed.invited_by_lead_slug,
        };
      })();
  const campaign = await findCampaignBySlug(slug);
  if (!campaign) throw new PublicCampaignError("Campanha indisponível", 404);
  const current = await prisma.participant.findUnique({
    where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail: input.email } },
  });
  if (current && !isLegacy) throw new PublicCampaignError("Este e-mail já participa da campanha", 409);
  const referralCodeParticipant = input.referralCode
    ? await prisma.participant.findUnique({ where: { referralCode: input.referralCode } })
    : null;
  const invitedBySlug = input.invitedByLeadSlug
    ? await prisma.lead.findFirst({ where: { campaignId: campaign.id, slug: input.invitedByLeadSlug } })
    : null;
  const invitedByReferralCode = referralCodeParticipant?.campaignId === campaign.id
    ? await prisma.lead.findFirst({
        where: { campaignId: campaign.id, participantId: referralCodeParticipant.id },
      })
    : null;
  const inviterLead = invitedBySlug ?? invitedByReferralCode;
  const validInviterLead = inviterLead?.normalizedEmail === input.email ? null : inviterLead;
  const result = await prisma.$transaction(async (transaction) => {
    const participantResult = await ensureParticipant(transaction, campaign, input);
    if (participantResult.created) {
      await transaction.consent.createMany({ data: [
        {
          clientId: campaign.clientId,
          participantId: participantResult.participant.id,
          type: "TERMS",
          policyVersion: "1.0",
          granted: true,
          ipHash: hashValue(metadata.forwardedFor ?? "unknown"),
          userAgentHash: hashValue(metadata.userAgent ?? "unknown"),
        },
        {
          clientId: campaign.clientId,
          participantId: participantResult.participant.id,
          type: "PRIVACY",
          policyVersion: "1.0",
          granted: true,
        },
      ] });
    }
    const existingLead = await transaction.lead.findUnique({
      where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail: input.email } },
    });
    const currentLeadSlug = existingLead?.slug ?? await createUniqueLeadSlug(transaction);
    const lead = await transaction.lead.upsert({
      where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail: input.email } },
      create: {
        clientId: campaign.clientId,
        campaignId: campaign.id,
        participantId: participantResult.participant.id,
        slug: currentLeadSlug,
        name: input.name,
        email: input.email,
        normalizedEmail: input.email,
        phone: input.phone,
        source: isLegacy ? "campaign-registration" : "growth-loop-registration",
        utmSource: "public-api",
        utmMedium: "registration",
        utmCampaign: campaign.slug,
        convertedAt: new Date(),
      },
      update: {
        participantId: participantResult.participant.id,
        slug: currentLeadSlug,
        name: input.name,
        phone: input.phone,
        convertedAt: new Date(),
      },
    });
    const leadCampaign = await transaction.leadCampaign.upsert({
      where: { campaignId_leadId: { campaignId: campaign.id, leadId: lead.id } },
      create: {
        clientId: campaign.clientId,
        campaignId: campaign.id,
        leadId: lead.id,
        invitedByLeadId: validInviterLead?.id,
      },
      update: {},
    });
    if (participantResult.created && validInviterLead?.participantId) {
      await transaction.referral.create({ data: {
        clientId: campaign.clientId,
        campaignId: campaign.id,
        referrerParticipantId: validInviterLead.participantId,
        referredParticipantId: participantResult.participant.id,
        status: "REGISTERED",
        registeredAt: new Date(),
        attributionKey: `${campaign.id}:${participantResult.participant.id}`,
        ruleVersion: 1,
      } });
    }
    return { ...participantResult, lead, leadCampaign };
  });
  const initialReward = campaign.rewards.find((reward) => ["INITIAL", "cadastro", "FIRST"].includes(reward.key));
  const initialRule = initialReward?.ruleVersions[0];
  if (result.created && initialReward && initialRule) {
    await grantReward({
      clientId: campaign.clientId,
      campaignId: campaign.id,
      participantId: result.participant.id,
      rewardId: initialReward.id,
      ruleVersionId: initialRule.id,
      milestone: "REGISTRATION_COMPLETED",
    });
  }
  if (result.created) {
    await prisma.domainEvent.upsert({
      where: { idempotencyKey: `participant-registered:${result.participant.id}` },
      update: {},
      create: {
        clientId: campaign.clientId,
        aggregateType: "Participant",
        aggregateId: result.participant.id,
        eventType: "ParticipantRegistered",
        idempotencyKey: `participant-registered:${result.participant.id}`,
        payload: { campaignId: campaign.id },
      },
    });
  }
  const firstEmail = emailTemplate(campaign, "FIRST_REWARD", "INITIAL_REWARD");
  if (!result.lead.slug) throw new PublicCampaignError("Lead sem slug para acesso à recompensa.", 500);
  const rewardUrl = `${publicBaseUrl()}/api/campaigns/${encodeURIComponent(campaign.slug)}/leads/${encodeURIComponent(result.lead.slug)}/claim_reward`;
  const inviteUrl = `${publicBaseUrl()}/c/${encodeURIComponent(campaign.slug)}?invited_by_lead_slug=${encodeURIComponent(result.lead.slug)}`;
  const rewardEmail = buildFirstRewardEmail({
    participantName: input.name,
    campaignName: campaign.name,
    rewardTitle: campaign.initialRewardTitle,
    rewardValue: campaign.initialRewardValue ?? "",
    rewardUrl,
    inviteUrl,
    qualifiedReferralGoal: campaign.qualifiedReferralGoal,
    secondRewardTitle: campaign.milestoneRewardTitle,
    customTemplate: firstEmail,
  });
  await sendCampaignEmail({
    to: input.email,
    ...rewardEmail,
  });
  return {
    success: true,
    message: result.created ? "Participante registrado com sucesso." : "Cadastro atualizado com sucesso.",
    participantId: result.participant.id,
    referralCode: result.participant.referralCode,
    accessToken: result.accessToken,
    lead: {
      id: result.lead.id,
      slug: result.lead.slug,
      invited_by_lead_id: result.leadCampaign.invitedByLeadId,
      name: result.lead.name,
      email: result.lead.email,
      whatsapp: result.lead.phone ?? "",
      created_at: result.lead.createdAt,
      updated_at: result.lead.convertedAt ?? result.lead.createdAt,
    },
  };
}

function rewardRedirectUrl(value: string | null | undefined, fallback: string) {
  const candidate = value ?? fallback;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Protocolo inválido");
    return url.toString();
  } catch {
    throw new PublicCampaignError("Link da recompensa não configurado corretamente.", 422);
  }
}

export async function claimCampaignReward(campaignSlug: string, requestedLeadSlug: string) {
  leadSlugSchema.parse(requestedLeadSlug);
  const campaign = await findCampaignBySlug(campaignSlug);
  if (!campaign) throw new PublicCampaignError("Campanha não encontrada", 404);

  const lead = await prisma.lead.findFirst({
    where: { campaignId: campaign.id, slug: requestedLeadSlug },
  });
  if (!lead) throw new PublicCampaignError("Lead não encontrado na campanha", 404);

  const membership = await prisma.leadCampaign.findUnique({
    where: { campaignId_leadId: { campaignId: campaign.id, leadId: lead.id } },
  });
  if (!membership) throw new PublicCampaignError("Associação do lead com a campanha não encontrada", 404);

  const claimedAt = new Date();
  const claim = await prisma.$transaction(async (transaction) => {
    const updatedMembership = await transaction.leadCampaign.update({
      where: { id: membership.id },
      data: {
        firstRewardClaimedAt: membership.firstRewardClaimedAt ?? claimedAt,
        firstRewardLastClaimedAt: claimedAt,
        firstRewardClaimCount: { increment: 1 },
      },
    });
    if (lead.participantId) {
      await transaction.participant.update({
        where: { id: lead.participantId },
        data: { initialRewardAccessedAt: claimedAt },
      });
      const referral = await transaction.referral.findFirst({
        where: { campaignId: campaign.id, referredParticipantId: lead.participantId },
      });
      if (referral && referral.status !== "REJECTED") {
        await transaction.referral.update({
          where: { id: referral.id },
          data: {
            status: "QUALIFIED",
            registeredAt: referral.registeredAt ?? claimedAt,
            validatedAt: referral.validatedAt ?? claimedAt,
            qualifiedAt: referral.qualifiedAt ?? claimedAt,
          },
        });
      }
    }
    const qualifiedInvites = membership.invitedByLeadId
      ? await transaction.leadCampaign.count({
          where: {
            campaignId: campaign.id,
            invitedByLeadId: membership.invitedByLeadId,
            firstRewardClaimedAt: { not: null },
          },
        })
      : 0;
    const inviterMembership = membership.invitedByLeadId
      ? await transaction.leadCampaign.findUnique({
          where: {
            campaignId_leadId: {
              campaignId: campaign.id,
              leadId: membership.invitedByLeadId,
            },
          },
        })
      : null;
    return { updatedMembership, qualifiedInvites, inviterMembership };
  });

  if (
    claim.inviterMembership
    && claim.qualifiedInvites >= campaign.qualifiedReferralGoal
    && !claim.inviterMembership.secondRewardSent
  ) {
    const staleSendingAt = new Date(Date.now() - 10 * 60 * 1000);
    const deliveryLease = await prisma.leadCampaign.updateMany({
      where: {
        id: claim.inviterMembership.id,
        secondRewardSent: false,
        OR: [
          { secondRewardSendingAt: null },
          { secondRewardSendingAt: { lt: staleSendingAt } },
        ],
      },
      data: { secondRewardSendingAt: new Date() },
    });
    if (deliveryLease.count === 1) {
      try {
        const inviterLead = await prisma.lead.findUnique({ where: { id: claim.inviterMembership.leadId } });
        if (!inviterLead) throw new Error("Lead indicador não encontrado");
        const secondReward = campaign.rewards.find((reward) => ["indicacoes", "MILESTONE", "SECOND"].includes(reward.key));
        const secondEmail = emailTemplate(campaign, "SECOND_REWARD", "MILESTONE_REWARD");
        const secondRewardUrl = rewardRedirectUrl(secondReward?.claimUrl, templateUrl(campaign.slug));
        const milestoneVariables = {
          participantName: inviterLead.name,
          campaignName: campaign.name,
          rewardTitle: campaign.milestoneRewardTitle,
          rewardValue: campaign.milestoneRewardValue ?? "",
          rewardUrl: secondRewardUrl,
          qualifiedReferralGoal: String(campaign.qualifiedReferralGoal),
        };
        await sendCampaignEmail({
          to: inviterLead.email,
          subject: secondEmail?.subject ?? `Você desbloqueou: ${campaign.milestoneRewardTitle}`,
          html: secondEmail?.html
            ? renderEmailTemplate(secondEmail.html, milestoneVariables)
            : `<h1>${escapeHtml(campaign.milestoneRewardTitle)}</h1><p>${escapeHtml(campaign.milestoneRewardValue)}</p><p><a href="${escapeHtml(secondRewardUrl)}">Acessar recompensa</a></p>`,
        });
        if (inviterLead.participantId && secondReward?.ruleVersions[0]) {
          await grantReward({
            clientId: campaign.clientId,
            campaignId: campaign.id,
            participantId: inviterLead.participantId,
            rewardId: secondReward.id,
            ruleVersionId: secondReward.ruleVersions[0].id,
            milestone: `QUALIFIED_${campaign.qualifiedReferralGoal}`,
          });
        }
        await prisma.leadCampaign.update({
          where: { id: claim.inviterMembership.id },
          data: { secondRewardSent: true, secondRewardSentAt: new Date(), secondRewardSendingAt: null },
        });
      } catch (error) {
        console.error("Falha ao enviar a segunda recompensa:", error);
        await prisma.leadCampaign.updateMany({
          where: { id: claim.inviterMembership.id, secondRewardSent: false },
          data: { secondRewardSendingAt: null },
        });
      }
    }
  }

  const firstReward = campaign.rewards.find((reward) => ["cadastro", "INITIAL", "FIRST"].includes(reward.key));
  return {
    redirectUrl: rewardRedirectUrl(firstReward?.claimUrl, templateUrl(campaign.slug)),
    leadSlug: requestedLeadSlug,
    firstRewardClaimCount: claim.updatedMembership.firstRewardClaimCount,
  };
}
