import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/authorization";
import { z } from "zod";

const updateSchema = z.object({ status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"]).optional(), name: z.string().min(3).max(100).optional(), description: z.string().max(500).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const input = updateSchema.parse(await request.json()); const { clientId, userId } = await requireTenant();
    const existing = await prisma.growthLoopCampaign.findFirst({ where: { id, clientId } });
    if (!existing) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    const campaign = await prisma.growthLoopCampaign.update({ where: { id }, data: input });
    await prisma.auditLog.create({ data: { clientId, campaignId: id, actorId: userId, actorType: "USER", action: "CAMPAIGN_UPDATED", entityType: "Campaign", entityId: id, metadata: input } });
    return NextResponse.json(campaign);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Erro" }, { status: 400 }); }
}
