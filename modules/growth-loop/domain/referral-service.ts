import { prisma } from "@/lib/prisma";
import { evaluateMilestone } from "./reward-service";

export async function qualifyReferral(referralId: string) {
  const referral = await prisma.referral.findUnique({ where: { id: referralId }, include: { referred: true } });
  if (!referral?.referred || referral.status === "REJECTED") return null;
  const participant = referral.referred;
  if (!participant.registrationCompletedAt || !participant.emailVerifiedAt || !participant.initialRewardAccessedAt) return null;
  if (participant.id === referral.referrerParticipantId) {
    return prisma.referral.update({ where: { id: referral.id }, data: { status: "REJECTED", rejectedReason: "SELF_REFERRAL" } });
  }
  const qualified = await prisma.referral.update({ where: { id: referral.id }, data: { status: "QUALIFIED", qualifiedAt: new Date(), validatedAt: referral.validatedAt ?? new Date() } });
  await evaluateMilestone(referral.referrerParticipantId);
  return qualified;
}
