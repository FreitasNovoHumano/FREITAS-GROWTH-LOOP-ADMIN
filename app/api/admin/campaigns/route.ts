import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminTenant, AuthorizationError } from "@/lib/authorization";
import { campaignSchema } from "@/modules/growth-loop/schemas/campaign";

export async function GET(request: Request) {
  try {
    const clientIdParam = new URL(request.url).searchParams.get("clientId") ?? undefined;
    const { clientId } = await requireAdminTenant(clientIdParam);
    const campaigns = await prisma.growthLoopCampaign.findMany({ where: { clientId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { participants: true, leads: true, referrals: true } } } });
    return NextResponse.json(campaigns);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: error instanceof AuthorizationError ? 403 : 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = campaignSchema.parse(body);
    const { clientId, userId } = await requireAdminTenant(body.clientId);
    const campaign = await prisma.growthLoopCampaign.create({ data: {
      clientId, createdById: userId, name: input.name, slug: input.slug, description: input.description,
      initialRewardTitle: input.initialRewardTitle, initialRewardValue: input.initialRewardValue,
      milestoneRewardTitle: input.milestoneRewardTitle, milestoneRewardValue: input.milestoneRewardValue,
      qualifiedReferralGoal: input.qualifiedReferralGoal, primaryColor: input.primaryColor,
      page: { create: { headline: input.name, subheadline: input.description, ctaLabel: "Quero participar" } },
      ruleVersions: { create: { version: 1, qualifiedReferralGoal: input.qualifiedReferralGoal, snapshot: { qualifiedReferralGoal: input.qualifiedReferralGoal, requireEmailVerified: true, requireInitialAccess: true } } },
      rewards: { create: [
        { clientId, key: "INITIAL", title: input.initialRewardTitle, value: input.initialRewardValue, kind: "LINK", ruleVersions: { create: { version: 1, milestone: "REGISTRATION_COMPLETED", threshold: 0, snapshot: { type: "initial" } } } },
        { clientId, key: "MILESTONE", title: input.milestoneRewardTitle, value: input.milestoneRewardValue, kind: "LINK", ruleVersions: { create: { version: 1, milestone: `QUALIFIED_${input.qualifiedReferralGoal}`, threshold: input.qualifiedReferralGoal, snapshot: { type: "qualified_referrals", threshold: input.qualifiedReferralGoal } } } },
      ]},
    }});
    await prisma.auditLog.create({ data: { clientId, campaignId: campaign.id, actorId: userId, actorType: "USER", action: "CAMPAIGN_CREATED", entityType: "Campaign", entityId: campaign.id, metadata: { name: input.name } } });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) return NextResponse.json({ error: "Dados inválidos", details: error }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: error instanceof AuthorizationError ? 403 : 500 });
  }
}
