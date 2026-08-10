import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { embedConfigurationPatchSchema } from "@/lib/embed-config";
import { z } from "zod";
import { notifyClient } from "@/lib/notifications";

const updateSchema = z
  .object({
    status: z
      .enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"])
      .optional(),
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .extend(embedConfigurationPatchSchema.shape);
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const input = updateSchema.parse(await request.json()); const { clientId, userId } = await requireAdminTenant();
    const existing = await prisma.growthLoopCampaign.findFirst({ where: { id, clientId } });
    if (!existing) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    const campaign = await prisma.growthLoopCampaign.update({ where: { id }, data: input });
    await prisma.auditLog.create({ data: { clientId, campaignId: id, actorId: userId, actorType: "USER", action: "CAMPAIGN_UPDATED", entityType: "Campaign", entityId: id, metadata: input } });
    if (input.status === "ACTIVE" || input.status === "PAUSED") {
      await notifyClient({ clientId, eventKey: input.status === "ACTIVE" ? "campaign.activated" : "campaign.paused", title: input.status === "ACTIVE" ? "Campanha ativada" : "Campanha pausada", message: `${campaign.name} foi ${input.status === "ACTIVE" ? "ativada" : "pausada"}.`, type: `CAMPAIGN_${input.status}`, link: `/dashboard/campaigns/${campaign.id}` });
    }
    return NextResponse.json(campaign);
  } catch (error) { return NextResponse.json({ error: error instanceof AuthorizationError ? "Acesso negado." : "Não foi possível atualizar a campanha." }, { status: error instanceof AuthorizationError ? 403 : 400 }); }
}
