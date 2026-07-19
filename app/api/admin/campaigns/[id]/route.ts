import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AuthorizationError, requireTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const nullableDateSchema = z.union([
  z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida").transform((value) => new Date(value)),
  z.null(),
]);

const updateSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"]).optional(),
  startsAt: nullableDateSchema.optional(),
  endsAt: nullableDateSchema.optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().trim().url().max(2_048).nullable().optional(),
  initialRewardTitle: z.string().trim().min(3).max(120).optional(),
  initialRewardValue: z.string().trim().max(200).nullable().optional(),
  milestoneRewardTitle: z.string().trim().min(3).max(120).optional(),
  milestoneRewardValue: z.string().trim().max(200).nullable().optional(),
  qualifiedReferralGoal: z.coerce.number().int().min(1).max(100).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, "Informe ao menos um campo para atualização");

type RouteContext = { params: Promise<{ id: string }> };

function authorizationResponse(error: AuthorizationError) {
  const unauthenticated = error.message === "Não autenticado";
  return NextResponse.json(
    { error: unauthenticated ? "Não autenticado" : "Acesso negado" },
    { status: unauthenticated ? 401 : 403 },
  );
}

function validationResponse(error: ZodError) {
  return NextResponse.json({
    error: "Dados inválidos",
    details: error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
  }, { status: 400 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const parsedId = objectIdSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const { clientId } = await requireTenant();
    const campaign = await prisma.growthLoopCampaign.findFirst({
      where: { id: parsedId.data, clientId },
      include: {
        page: true,
        rewards: {
          include: { ruleVersions: { orderBy: { version: "desc" } } },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            participants: true,
            leads: true,
            leadCampaigns: true,
            invitations: true,
            referrals: true,
            templates: true,
          },
        },
      },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }
    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof AuthorizationError) return authorizationResponse(error);
    console.error("Falha ao consultar campanha administrativa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const parsedId = objectIdSchema.safeParse((await params).id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const input = updateSchema.parse(await request.json());
    const { clientId, userId } = await requireTenant();
    const existing = await prisma.growthLoopCampaign.findFirst({
      where: { id: parsedId.data, clientId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const startsAt = input.startsAt === undefined ? existing.startsAt : input.startsAt;
    const endsAt = input.endsAt === undefined ? existing.endsAt : input.endsAt;
    if (startsAt && endsAt && endsAt <= startsAt) {
      return NextResponse.json({
        error: "Dados inválidos",
        details: [{ field: "endsAt", message: "A data final deve ser posterior à data inicial" }],
      }, { status: 400 });
    }

    const campaign = await prisma.growthLoopCampaign.update({
      where: { id: existing.id },
      data: input,
    });
    await prisma.auditLog.create({
      data: {
        clientId,
        campaignId: existing.id,
        actorId: userId,
        actorType: "USER",
        action: "CAMPAIGN_UPDATED",
        entityType: "Campaign",
        entityId: existing.id,
        metadata: input,
      },
    });
    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof AuthorizationError) return authorizationResponse(error);
    if (error instanceof ZodError) return validationResponse(error);
    console.error("Falha ao atualizar campanha administrativa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
