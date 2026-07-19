import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.growthLoopCampaign.findFirst({ where: { slug, status: "ACTIVE" }, select: { id: true, name: true, slug: true, description: true, primaryColor: true, accentColor: true, logoUrl: true, initialRewardTitle: true, initialRewardValue: true, milestoneRewardTitle: true, milestoneRewardValue: true, qualifiedReferralGoal: true, page: true } });
  return campaign ? NextResponse.json(campaign) : NextResponse.json({ error: "Campanha indisponível" }, { status: 404 });
}
