import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  publicCampaignClientIdSchema,
  publicCampaignWhere,
} from "@/lib/public-campaign";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const requestedClientId = new URL(request.url).searchParams.get("clientId");
  const clientId = requestedClientId
    ? publicCampaignClientIdSchema.safeParse(requestedClientId)
    : null;

  if (clientId && !clientId.success) {
    return NextResponse.json(
      { error: "Empresa inválida." },
      { status: 400 },
    );
  }

  const campaign = await prisma.growthLoopCampaign.findFirst({
    where: publicCampaignWhere(slug, clientId?.data),
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      primaryColor: true,
      accentColor: true,
      logoUrl: true,
      initialRewardTitle: true,
      initialRewardValue: true,
      milestoneRewardTitle: true,
      milestoneRewardValue: true,
      qualifiedReferralGoal: true,
      page: true,
    },
  });

  return campaign
    ? NextResponse.json(campaign)
    : NextResponse.json(
        { error: "Campanha indisponível" },
        { status: 404 },
      );
}
