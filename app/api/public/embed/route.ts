import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveEmbedConfiguration } from "@/lib/embed-config";
import { verifyPublicClientToken } from "@/lib/embed";
import { prisma } from "@/lib/prisma";
import { publicCampaignWhere } from "@/lib/public-campaign";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  token: z.string().min(20).max(500),
  campaign: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const corsHeaders = {
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
};

export async function GET(request: Request) {
  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) {
    return NextResponse.json(
      { error: "Configuração de embed inválida." },
      { status: 400, headers: corsHeaders },
    );
  }

  const clientId = verifyPublicClientToken(query.data.token);
  if (!clientId) {
    return NextResponse.json(
      { error: "Token público inválido." },
      { status: 403, headers: corsHeaders },
    );
  }

  const campaign = await prisma.growthLoopCampaign.findFirst({
    where: publicCampaignWhere(query.data.campaign, clientId),
    select: {
      name: true,
      slug: true,
      primaryColor: true,
      accentColor: true,
      embedButtonLabel: true,
      embedButtonIcon: true,
      embedButtonStyle: true,
      embedPosition: true,
      embedDelayMs: true,
      embedAnimation: true,
      embedInitiallyExpanded: true,
      page: { select: { ctaLabel: true } },
    },
  });
  if (!campaign) {
    return NextResponse.json(
      { error: "Campanha não publicada ou indisponível." },
      { status: 404, headers: corsHeaders },
    );
  }

  const publicUrl = new URL(`/growth-loop/${campaign.slug}`, request.url);
  publicUrl.searchParams.set("clientId", clientId);
  const embedConfiguration = resolveEmbedConfiguration(
    campaign,
    campaign.page?.ctaLabel || "Participar agora",
  );

  return NextResponse.json(
    {
      name: campaign.name,
      slug: campaign.slug,
      primaryColor: campaign.primaryColor,
      accentColor: campaign.accentColor,
      buttonLabel: embedConfiguration.embedButtonLabel,
      buttonIcon: embedConfiguration.embedButtonIcon,
      buttonStyle: embedConfiguration.embedButtonStyle,
      position: embedConfiguration.embedPosition,
      delayMs: embedConfiguration.embedDelayMs,
      animation: embedConfiguration.embedAnimation,
      initiallyExpanded: embedConfiguration.embedInitiallyExpanded,
      publicUrl: publicUrl.toString(),
    },
    { headers: corsHeaders },
  );
}
