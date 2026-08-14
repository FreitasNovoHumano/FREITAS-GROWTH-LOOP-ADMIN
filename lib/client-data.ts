import { prisma } from "@/lib/prisma";
import {
  calculateConversionRate,
  type ListQuery,
  periodStart,
  scopeToClient,
} from "@/lib/client-area";

function dateFilter(query: ListQuery) {
  if (!query.dateFrom && !query.dateTo) return undefined;
  return {
    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
    ...(query.dateTo ? { lte: query.dateTo } : {}),
  };
}

export async function getClientOverview(
  clientId: string,
  range: { gte: Date; lte?: Date } = { gte: periodStart(30) },
) {
  const scopedCreatedAt = range;

  const [
    activeCampaigns,
    participants,
    referrals,
    leads,
    releasedRewards,
    invitations,
    completedRegistrations,
    recentCampaigns,
    recentEvents,
    endingCampaigns,
  ] = await Promise.all([
    prisma.growthLoopCampaign.count({
      where: { clientId, status: "ACTIVE", createdAt: scopedCreatedAt },
    }),
    prisma.participant.count({
      where: { clientId, createdAt: scopedCreatedAt },
    }),
    prisma.referral.count({
      where: { clientId, createdAt: scopedCreatedAt },
    }),
    prisma.lead.count({
      where: { clientId, createdAt: scopedCreatedAt },
    }),
    prisma.rewardGrant.count({
      where: {
        clientId,
        grantedAt: scopedCreatedAt,
        status: { in: ["AVAILABLE", "CLAIMED"] },
      },
    }),
    prisma.invitation.count({
      where: { clientId, createdAt: scopedCreatedAt },
    }),
    prisma.participant.count({
      where: {
        clientId,
        registrationCompletedAt: range,
      },
    }),
    prisma.growthLoopCampaign.findMany({
      where: { clientId, createdAt: scopedCreatedAt },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: {
          select: {
            participants: { where: { createdAt: scopedCreatedAt } },
            leads: { where: { createdAt: scopedCreatedAt } },
            referrals: { where: { createdAt: scopedCreatedAt } },
            invitations: { where: { createdAt: scopedCreatedAt } },
          },
        },
      },
    }),
    prisma.domainEvent.findMany({
      where: { clientId, createdAt: scopedCreatedAt },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        eventType: true,
        aggregateType: true,
        createdAt: true,
      },
    }),
    prisma.growthLoopCampaign.count({
      where: {
        clientId,
        status: "ACTIVE",
        endsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    metrics: {
      activeCampaigns,
      participants,
      referrals,
      leads,
      releasedRewards,
      conversionRate: calculateConversionRate(
        completedRegistrations,
        invitations,
      ),
    },
    recentCampaigns: recentCampaigns.map((campaign) => ({
      ...campaign,
      conversionRate: calculateConversionRate(
        campaign._count.leads,
        campaign._count.invitations,
      ),
    })),
    recentEvents,
    pending: {
      rewardsAwaitingDelivery: await prisma.rewardGrant.count({
        where: { clientId, status: "AVAILABLE", grantedAt: scopedCreatedAt },
      }),
      campaignsEndingSoon: endingCampaigns,
    },
  };
}

export async function getClientReport(
  clientId: string,
  range: { gte: Date; lte?: Date } = { gte: periodStart(30) },
) {
  const [participants, invitations, referrals, qualified, leads, rewards] =
    await Promise.all([
      prisma.participant.count({
        where: { clientId, registrationCompletedAt: range },
      }),
      prisma.invitation.count({ where: { clientId, createdAt: range } }),
      prisma.referral.count({ where: { clientId, createdAt: range } }),
      prisma.referral.count({
        where: { clientId, status: "QUALIFIED", qualifiedAt: range },
      }),
      prisma.lead.count({ where: { clientId, createdAt: range } }),
      prisma.rewardGrant.count({
        where: {
          clientId,
          grantedAt: range,
          status: { in: ["AVAILABLE", "CLAIMED"] },
        },
      }),
    ]);

  return {
    funnel: { participants, invitations, referrals, qualified },
    totals: { leads, rewards },
    qualificationRate: calculateConversionRate(qualified, referrals),
  };
}

export async function getClientCampaigns(
  clientId: string,
  query: ListQuery,
) {
  const createdAt = dateFilter(query);
  const where = scopeToClient(clientId, {
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" as const } }
      : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(createdAt ? { createdAt } : {}),
  });

  const [items, total] = await Promise.all([
    prisma.growthLoopCampaign.findMany({
      where,
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        _count: {
          select: {
            participants: true,
            referrals: true,
            leads: true,
            invitations: true,
          },
        },
      },
    }),
    prisma.growthLoopCampaign.count({ where }),
  ]);

  return { items, total };
}

export async function getClientCampaignDetail(
  clientId: string,
  campaignId: string,
) {
  const campaign = await prisma.growthLoopCampaign.findFirst({
      where: scopeToClient(clientId, { id: campaignId }),
      include: {
        page: true,
        _count: {
          select: {
            participants: true,
            referrals: true,
            leads: true,
            invitations: true,
            rewards: true,
          },
        },
        participants: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            qualifiedReferralCount: true,
            createdAt: true,
          },
        },
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            clickedAt: true,
            registeredAt: true,
            validatedAt: true,
            qualifiedAt: true,
            referrer: { select: { name: true } },
            referred: { select: { name: true } },
          },
        },
        leads: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            source: true,
            createdAt: true,
          },
        },
      },
    });
  if (!campaign) return null;

  const [registered, qualified, rewardsReleased, rewardGrants] = await Promise.all([
    prisma.referral.count({
      where: {
        clientId,
        campaignId,
        status: { in: ["REGISTERED", "VALIDATED", "QUALIFIED"] },
      },
    }),
    prisma.referral.count({
      where: { clientId, campaignId, status: "QUALIFIED" },
    }),
    prisma.rewardGrant.count({
      where: {
        clientId,
        campaignId,
        status: { in: ["AVAILABLE", "CLAIMED"] },
      },
    }),
    prisma.rewardGrant.findMany({
      where: { clientId, campaignId },
      orderBy: { grantedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        milestone: true,
        grantedAt: true,
        participant: { select: { name: true } },
        reward: { select: { title: true } },
      },
    }),
  ]);

  return {
    campaign,
    rewardGrants,
    funnel: [
      { label: "Convites enviados", value: campaign._count.invitations },
      { label: "Convidados cadastrados", value: registered },
      { label: "Leads gerados", value: campaign._count.leads },
      { label: "Indicações qualificadas", value: qualified },
      { label: "Recompensas liberadas", value: rewardsReleased },
    ],
  };
}

export async function getClientParticipantDetail(
  clientId: string,
  participantId: string,
) {
  return prisma.participant.findFirst({
    where: scopeToClient(clientId, { id: participantId }),
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      qualifiedReferralCount: true,
      createdAt: true,
      updatedAt: true,
      campaign: {
        select: {
          id: true,
          name: true,
          qualifiedReferralGoal: true,
        },
      },
      referrals: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          clickedAt: true,
          qualifiedAt: true,
          referred: { select: { name: true } },
        },
      },
      grants: {
        orderBy: { grantedAt: "desc" },
        take: 50,
        select: {
          id: true,
          status: true,
          milestone: true,
          grantedAt: true,
          reward: { select: { title: true } },
        },
      },
    },
  });
}

export async function getClientLeads(clientId: string, query: ListQuery) {
  const createdAt = dateFilter(query);
  const where = scopeToClient(clientId, {
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
            { phone: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  });
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { campaign: { select: { name: true } } },
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.lead.count({ where }),
  ]);
  return { items, total };
}

export async function getClientParticipants(
  clientId: string,
  query: ListQuery,
) {
  const createdAt = dateFilter(query);
  const where = scopeToClient(clientId, {
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  });
  const [items, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      include: {
        campaign: {
          select: { name: true, qualifiedReferralGoal: true },
        },
        _count: { select: { referrals: true, grants: true } },
      },
      orderBy: { createdAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.participant.count({ where }),
  ]);
  return { items, total };
}

export async function getClientRewards(clientId: string, query: ListQuery) {
  const grantedAt = dateFilter(query);
  const where = scopeToClient(clientId, {
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(query.status ? { status: query.status as never } : {}),
    ...(grantedAt ? { grantedAt } : {}),
    ...(query.search
      ? {
          OR: [
            {
              participant: {
                is: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              reward: {
                is: {
                  title: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  });
  const [items, total] = await Promise.all([
    prisma.rewardGrant.findMany({
      where,
      include: {
        participant: { select: { name: true, email: true } },
        reward: {
          select: {
            title: true,
            kind: true,
            campaign: { select: { name: true } },
          },
        },
      },
      orderBy: { grantedAt: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.rewardGrant.count({ where }),
  ]);
  return { items, total };
}
