import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  activeCampaignWhere,
  publicCampaignClientIdSchema,
  serializePublicCampaign,
} from "@/lib/public-campaign";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const clientId = publicCampaignClientIdSchema.safeParse(
    new URL(request.url).searchParams.get("clientId"),
  );

  if (!clientId.success) {
    return NextResponse.json(
      { error: "Informe uma empresa válida." },
      { status: 400 },
    );
  }

  const campaign = await prisma.growthLoopCampaign.findFirst({
    where: activeCampaignWhere(clientId.data),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      status: true,
      clientId: true,
      page: { select: { heroImageUrl: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Nenhuma campanha ativa no momento." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    serializePublicCampaign(campaign, request.url),
    { headers: { "cache-control": "no-store" } },
  );
}
