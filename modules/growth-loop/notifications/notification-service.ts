import { Prisma, type DomainEvent } from "@prisma/client";

import { hashValue, maskEmail } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { hydrateTemplate, serializeTemplate, type EmailTemplateKey } from "@/modules/growth-loop/email/templates";
import { renderTemplate } from "@/modules/growth-loop/notifications/template-renderer";
import { sendEmail } from "@/modules/growth-loop/notifications/email-service";
import { maskWhatsAppNumber, parseWhatsAppNumbers } from "@/modules/growth-loop/notifications/whatsapp-numbers";
import { sendWhatsApp } from "@/modules/growth-loop/notifications/whatsapp-service";
import { deliveryIdempotencyKey } from "@/modules/growth-loop/notifications/delivery-key";
import { notifyClient } from "@/lib/notifications";

type NotificationContext = {
  key: EmailTemplateKey;
  campaignId: string;
  email?: string;
  phones: string[];
  variables: Record<string, string | number | undefined>;
};

function publicCampaignUrl(slug: string, clientId: string, referralCode?: string) {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
  const params = new URLSearchParams({ clientId });
  if (referralCode) params.set("ref", referralCode);
  return `${base}/growth-loop/${slug}?${params}`;
}

async function notificationContext(event: DomainEvent): Promise<NotificationContext | null> {
  if (event.eventType === "ParticipantRegistered") {
    const participant = await prisma.participant.findFirst({
      where: { id: event.aggregateId, clientId: event.clientId },
      include: { campaign: { include: { rewards: true } } },
    });
    if (!participant) return null;
    const initialReward = participant.campaign.rewards.find((reward) => reward.key === "INITIAL");
    return {
      key: "WELCOME_INITIAL_REWARD",
      campaignId: participant.campaignId,
      email: participant.email,
      phones: [],
      variables: {
        participant_name: participant.name,
        campaign_name: participant.campaign.name,
        initial_reward_title: initialReward?.title,
        initial_reward_link: initialReward?.claimUrl ?? publicCampaignUrl(participant.campaign.slug, participant.clientId, participant.referralCode),
      },
    };
  }
  if (event.eventType === "InvitationCreated") {
    const invitation = await prisma.invitation.findFirst({
      where: { id: event.aggregateId, clientId: event.clientId },
      include: { campaign: true, inviter: true },
    });
    if (!invitation) return null;
    return {
      key: "REFERRAL_INVITE",
      campaignId: invitation.campaignId,
      email: invitation.inviteeEmail,
      phones: parseWhatsAppNumbers(invitation.normalizedPhone ?? invitation.inviteePhone ?? ""),
      variables: {
        participant_name: invitation.inviter.name,
        campaign_name: invitation.campaign.name,
        referral_link: publicCampaignUrl(invitation.campaign.slug, invitation.clientId, invitation.inviter.referralCode),
      },
    };
  }
  if (event.eventType === "ReferralQualified") {
    const referral = await prisma.referral.findFirst({
      where: { id: event.aggregateId, clientId: event.clientId },
      include: { campaign: true, referrer: true },
    });
    if (!referral) return null;
    return {
      key: "PARTICIPANT_PROGRESS",
      campaignId: referral.campaignId,
      email: referral.referrer.email,
      phones: parseWhatsAppNumbers(referral.referrer.normalizedPhone ?? referral.referrer.phone ?? ""),
      variables: {
        participant_name: referral.referrer.name,
        campaign_name: referral.campaign.name,
        qualified_referrals: referral.referrer.qualifiedReferralCount,
        referral_goal: referral.campaign.qualifiedReferralGoal,
        referral_link: publicCampaignUrl(referral.campaign.slug, referral.clientId, referral.referrer.referralCode),
      },
    };
  }
  if (event.eventType === "RewardUnlocked") {
    const grant = await prisma.rewardGrant.findFirst({
      where: { id: event.aggregateId, clientId: event.clientId },
      include: { participant: true, reward: { include: { campaign: true } } },
    });
    if (!grant) return null;
    return {
      key: "REWARD_UNLOCKED",
      campaignId: grant.campaignId,
      email: grant.participant.email,
      phones: parseWhatsAppNumbers(grant.participant.normalizedPhone ?? grant.participant.phone ?? ""),
      variables: {
        participant_name: grant.participant.name,
        campaign_name: grant.reward.campaign.name,
        reward_name: grant.reward.title,
        reward_link: grant.reward.claimUrl ?? publicCampaignUrl(grant.reward.campaign.slug, grant.clientId, grant.participant.referralCode),
      },
    };
  }
  return null;
}

async function claimDelivery(input: {
  event: DomainEvent;
  campaignId: string;
  channel: "EMAIL" | "WHATSAPP";
  recipient: string;
  masked: string;
}) {
  const recipientHash = hashValue(input.recipient);
  const idempotencyKey = deliveryIdempotencyKey(input.event.id, input.channel, recipientHash);
  try {
    return await prisma.automationDelivery.create({ data: {
      clientId: input.event.clientId,
      campaignId: input.campaignId,
      aggregateId: input.event.aggregateId,
      eventType: input.event.eventType,
      channel: input.channel,
      recipientHash,
      recipientMasked: input.masked,
      idempotencyKey,
      status: "PROCESSING",
    } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const existing = await prisma.automationDelivery.findUnique({ where: { idempotencyKey } });
    if (!existing || existing.status !== "FAILED") return null;
    const claimed = await prisma.automationDelivery.updateMany({ where: { id: existing.id, status: "FAILED" }, data: { status: "PROCESSING", error: null } });
    return claimed.count ? existing : null;
  }
}

async function failDelivery(id: string, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 500) : "Falha no envio";
  await prisma.automationDelivery.update({ where: { id }, data: { status: "FAILED", error: message } });
}

export async function sendNotification(event: DomainEvent) {
  const context = await notificationContext(event);
  if (!context) throw new Error(`Contexto não encontrado para ${event.eventType}`);
  const stored = await prisma.emailTemplate.findFirst({ where: { clientId: event.clientId, campaignId: null, key: context.key } });
  const template = hydrateTemplate(context.key, stored);
  const results: Array<{ channel: "EMAIL" | "WHATSAPP"; recipient: string; status: "sent" | "failed" | "skipped" }> = [];

  if (template.active && context.email) {
    const delivery = await claimDelivery({ event, campaignId: context.campaignId, channel: "EMAIL", recipient: context.email.toLowerCase(), masked: maskEmail(context.email) });
    if (!delivery) results.push({ channel: "EMAIL", recipient: maskEmail(context.email), status: "skipped" });
    else try {
      const renderedTemplate = {
        ...template,
        subject: renderTemplate(template.subject, context.variables),
        title: renderTemplate(template.title, context.variables),
        body: renderTemplate(template.body, context.variables),
        buttonText: renderTemplate(template.buttonText, context.variables),
        buttonUrl: renderTemplate(template.buttonUrl, context.variables),
      };
      const sent = await sendEmail({ clientId: event.clientId, to: context.email, subject: renderedTemplate.subject, html: serializeTemplate(renderedTemplate) });
      await prisma.automationDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", providerId: sent.providerId } });
      results.push({ channel: "EMAIL", recipient: maskEmail(context.email), status: "sent" });
    } catch (error) {
      await failDelivery(delivery.id, error);
      results.push({ channel: "EMAIL", recipient: maskEmail(context.email), status: "failed" });
    }
  }

  if (template.whatsappEnabled) {
    if (!context.phones.length) {
      const delivery = await claimDelivery({ event, campaignId: context.campaignId, channel: "WHATSAPP", recipient: `missing:${event.aggregateId}`, masked: "não informado" });
      if (delivery) await prisma.automationDelivery.update({ where: { id: delivery.id }, data: { status: "SKIPPED", error: "Destinatário sem telefone cadastrado" } });
      results.push({ channel: "WHATSAPP", recipient: "não informado", status: "skipped" });
    }
    for (const phone of context.phones) {
      const masked = maskWhatsAppNumber(phone);
      const delivery = await claimDelivery({ event, campaignId: context.campaignId, channel: "WHATSAPP", recipient: phone, masked });
      if (!delivery) { results.push({ channel: "WHATSAPP", recipient: masked, status: "skipped" }); continue; }
      try {
        const [sent] = await sendWhatsApp({ clientId: event.clientId, to: phone, message: renderTemplate(template.whatsappMessage, context.variables) });
        if (sent.status === "failed") throw new Error(sent.error);
        await prisma.automationDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", providerId: sent.providerId } });
        results.push({ channel: "WHATSAPP", recipient: masked, status: "sent" });
      } catch (error) {
        await failDelivery(delivery.id, error);
        results.push({ channel: "WHATSAPP", recipient: masked, status: "failed" });
      }
    }
  }
  const failed = results.filter((result) => result.status === "failed").length;
  if (failed) {
    for (const channel of ["EMAIL", "WHATSAPP"] as const) {
      const channelFailures = results.filter((result) => result.channel === channel && result.status === "failed").length;
      if (channelFailures) await notifyClient({ clientId: event.clientId, eventKey: channel === "EMAIL" ? "email.failed" : "whatsapp.failed", title: `Falha em ${channel === "EMAIL" ? "e-mail" : "WhatsApp"}`, message: `${channelFailures} entrega(s) falharam na automação ${event.eventType}.`, type: `AUTOMATION_${channel}_FAILED`, link: "/dashboard/emails" });
    }
    throw new Error(`${failed} entrega(s) da automação falharam`);
  }
  return results;
}

export async function processAutomationEvents(limit = 20) {
  const events = await prisma.domainEvent.findMany({
    where: { eventType: { in: ["ParticipantRegistered", "InvitationCreated", "ReferralQualified", "RewardUnlocked"] }, status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  const summary = { processed: 0, failed: 0, skipped: 0 };
  for (const event of events) {
    const claimed = await prisma.domainEvent.updateMany({ where: { id: event.id, status: { in: ["PENDING", "FAILED"] } }, data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null } });
    if (!claimed.count) { summary.skipped += 1; continue; }
    try {
      await sendNotification(event);
      await prisma.domainEvent.update({ where: { id: event.id }, data: { status: "COMPLETED", processedAt: new Date() } });
      summary.processed += 1;
    } catch (error) {
      const lastError = error instanceof Error ? error.message.slice(0, 500) : "Falha ao processar automação";
      await prisma.domainEvent.update({ where: { id: event.id }, data: { status: "FAILED", lastError, availableAt: new Date(Date.now() + 5 * 60_000) } });
      summary.failed += 1;
    }
  }
  return summary;
}
