import { prisma } from "@/lib/prisma";
import { evaluateMilestone } from "./reward-service";
import { queueAutomationEvent } from "@/modules/growth-loop/notifications/automation-events";

export async function qualifyReferral(referralId: string) {
  const referral = await prisma.referral.findUnique({ where: { id: referralId }, include: { referred: true } });
  if (!referral?.referred || referral.status === "REJECTED") return null;
  if (referral.status === "QUALIFIED") return referral;
  const participant = referral.referred;
  if (!participant.registrationCompletedAt || !participant.emailVerifiedAt || !participant.initialRewardAccessedAt) return null;
  if (participant.id === referral.referrerParticipantId) {
    return prisma.referral.update({ where: { id: referral.id }, data: { status: "REJECTED", rejectedReason: "SELF_REFERRAL" } });
  }
  const qualified = await prisma.referral.update({ where: { id: referral.id }, data: { status: "QUALIFIED", qualifiedAt: new Date(), validatedAt: referral.validatedAt ?? new Date() } });
  const grant = await evaluateMilestone(referral.referrerParticipantId);
  await Promise.allSettled([
    queueAutomationEvent({ clientId: qualified.clientId, aggregateType: "Referral", aggregateId: qualified.id, eventType: "ReferralQualified", campaignId: qualified.campaignId }),
    ...(grant ? [queueAutomationEvent({ clientId: grant.clientId, aggregateType: "RewardGrant" as const, aggregateId: grant.id, eventType: "RewardUnlocked" as const, campaignId: grant.campaignId })] : []),
  ]);
  return qualified;
}
