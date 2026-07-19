import { NextResponse } from "next/server";
import { AuthorizationError, requireTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

function authorizationResponse(error: AuthorizationError) {
  const unauthenticated = error.message === "Não autenticado";
  return NextResponse.json(
    { error: unauthenticated ? "Não autenticado" : "Acesso negado" },
    { status: unauthenticated ? 401 : 403 },
  );
}

export async function GET() {
  try {
    const { clientId } = await requireTenant();
    const campaignWhere = { clientId } as const;
    const [
      campaignsByStatus,
      leads,
      participants,
      qualifiedReferrals,
      firstRewardClaimed,
      secondRewardSent,
      recentCampaigns,
    ] = await Promise.all([
      prisma.growthLoopCampaign.groupBy({
        by: ["status"],
        where: campaignWhere,
        _count: { _all: true },
      }),
      prisma.lead.count({ where: { clientId } }),
      prisma.participant.count({ where: { clientId } }),
      prisma.referral.count({ where: { clientId, status: "QUALIFIED" } }),
      prisma.leadCampaign.count({ where: { clientId, firstRewardClaimedAt: { not: null } } }),
      prisma.leadCampaign.count({ where: { clientId, secondRewardSent: true } }),
      prisma.growthLoopCampaign.findMany({
        where: campaignWhere,
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { leads: true, participants: true, referrals: true } },
        },
      }),
    ]);

    const statusCounts = {
      DRAFT: 0,
      ACTIVE: 0,
      PAUSED: 0,
      ENDED: 0,
      ARCHIVED: 0,
    };
    for (const item of campaignsByStatus) statusCounts[item.status] = item._count._all;

    return NextResponse.json({
      campaigns: {
        total: Object.values(statusCounts).reduce((total, count) => total + count, 0),
        byStatus: statusCounts,
      },
      leads,
      participants,
      qualifiedReferrals,
      firstRewardClaimed,
      secondRewardSent,
      recentCampaigns,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) return authorizationResponse(error);
    console.error("Falha ao consultar visão geral administrativa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
