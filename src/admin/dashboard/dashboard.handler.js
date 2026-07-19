import prisma from "../../config/database.js";

/**
 * Retorna os indicadores agregados usados pelo dashboard do AdminJS.
 * Um convite é considerado convertido somente quando o lead possui indicador
 * e já acessou a primeira recompensa.
 */
export async function dashboardHandler() {
  const [leadsGenerated, leadsInvited, invitedLeadsClaimedReward] = await Promise.all([
    prisma.lead.count(),
    prisma.leadCampaign.count({
      where: {
        invitedByLeadId: { not: null },
      },
    }),
    prisma.leadCampaign.count({
      where: {
        invitedByLeadId: { not: null },
        firstRewardClaimedAt: { not: null },
      },
    }),
  ]);

  return {
    leadsGenerated,
    leadsInvited,
    invitedLeadsClaimedReward,
  };
}
