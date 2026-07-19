import { prisma } from "@/lib/prisma";

export async function grantReward(input: {
  clientId: string; campaignId: string; participantId: string;
  rewardId: string; ruleVersionId: string; milestone: string;
}) {
  const idempotencyKey = [input.campaignId, input.participantId, input.rewardId, input.ruleVersionId, input.milestone].join(":");
  return prisma.rewardGrant.upsert({
    where: { idempotencyKey },
    update: {},
    create: { ...input, idempotencyKey, status: "AVAILABLE" },
  });
}

export async function evaluateMilestone(referrerParticipantId: string) {
  const participant = await prisma.participant.findUnique({ where: { id: referrerParticipantId } });
  if (!participant) return null;
  const count = await prisma.referral.count({ where: { referrerParticipantId, status: "QUALIFIED" } });
  await prisma.participant.update({ where: { id: participant.id }, data: { qualifiedReferralCount: count } });
  const campaign = await prisma.growthLoopCampaign.findUnique({ where: { id: participant.campaignId } });
  if (!campaign || count < campaign.qualifiedReferralGoal) return null;
  const reward = await prisma.reward.findUnique({ where: { campaignId_key: { campaignId: campaign.id, key: "MILESTONE" } }, include: { ruleVersions: true } });
  const rule = reward?.ruleVersions.sort((a, b) => b.version - a.version)[0];
  if (!reward || !rule) return null;
  return grantReward({ clientId: participant.clientId, campaignId: campaign.id, participantId: participant.id, rewardId: reward.id, ruleVersionId: rule.id, milestone: `QUALIFIED_${campaign.qualifiedReferralGoal}` });
}
