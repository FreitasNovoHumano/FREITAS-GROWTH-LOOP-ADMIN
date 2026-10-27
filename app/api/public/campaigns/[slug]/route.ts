import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  publicCampaignClientIdSchema,
  publicCampaignWhere,
} from "@/lib/public-campaign";
import { getBranding } from "@/modules/settings/service";

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

  // Slug é único só por empresa: sem clientId, o link só vale se houver uma única campanha.
  const matches = await prisma.growthLoopCampaign.findMany({
    where: publicCampaignWhere(slug, clientId?.data),
    take: 2,
    select: {
      id: true,
      clientId: true,
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
  if (matches.length > 1) {
    return NextResponse.json(
      { error: "Link incompleto. Use o link completo da campanha." },
      { status: 409 },
    );
  }
  const campaign = matches[0];

  return campaign
    ? NextResponse.json({ ...campaign, branding: await getBranding(campaign.clientId) })
    : NextResponse.json(
        { error: "Campanha indisponível" },
        { status: 404 },
      );
}
