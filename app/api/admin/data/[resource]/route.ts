import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { AuthorizationError, requireTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const resources = ["leads", "participants", "rewards", "fraud"] as const;
type Resource = (typeof resources)[number];

function positiveInteger(value: string | null, fallback: number, maximum?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
}

function pagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource: rawResource } = await params;
    if (!resources.includes(rawResource as Resource)) {
      return NextResponse.json({ error: "Recurso inválido" }, { status: 404 });
    }

    const resource = rawResource as Resource;
    const searchParams = new URL(request.url).searchParams;
    const page = positiveInteger(searchParams.get("page"), 1);
    const pageSize = positiveInteger(searchParams.get("pageSize"), 20, 100);
    const q = searchParams.get("q")?.trim().slice(0, 200) ?? "";
    const campaignId = searchParams.get("campaignId")?.trim() || undefined;
    if (campaignId && !/^[a-f\d]{24}$/i.test(campaignId)) {
      return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }

    const { clientId } = await requireTenant();
    const skip = (page - 1) * pageSize;
    const campaignFilter = campaignId ? { campaignId } : {};

    if (resource === "leads") {
      const where = {
        clientId, ...campaignFilter,
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { campaign: { name: { contains: q, mode: "insensitive" } } },
        ] } : {}),
      } satisfies Prisma.LeadWhereInput;
      const [items, total] = await Promise.all([
        prisma.lead.findMany({ where, select: { name: true, email: true, phone: true, source: true, createdAt: true, campaign: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
        prisma.lead.count({ where }),
      ]);
      return NextResponse.json({ items, pagination: pagination(page, pageSize, total) });
    }

    if (resource === "participants") {
      const where = {
        clientId, ...campaignFilter,
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { campaign: { name: { contains: q, mode: "insensitive" } } },
        ] } : {}),
      } satisfies Prisma.ParticipantWhereInput;
      const [items, total] = await Promise.all([
        prisma.participant.findMany({ where, select: { name: true, email: true, phone: true, status: true, qualifiedReferralCount: true, createdAt: true, campaign: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
        prisma.participant.count({ where }),
      ]);
      return NextResponse.json({ items, pagination: pagination(page, pageSize, total) });
    }

    if (resource === "rewards") {
      const where = {
        clientId, ...campaignFilter,
        ...(q ? { OR: [
          { participant: { name: { contains: q, mode: "insensitive" } } },
          { participant: { email: { contains: q, mode: "insensitive" } } },
          { reward: { title: { contains: q, mode: "insensitive" } } },
          { milestone: { contains: q, mode: "insensitive" } },
        ] } : {}),
      } satisfies Prisma.RewardGrantWhereInput;
      const [items, total] = await Promise.all([
        prisma.rewardGrant.findMany({ where, select: { participant: { select: { name: true, email: true } }, reward: { select: { title: true, kind: true } }, milestone: true, status: true, grantedAt: true, expiresAt: true }, orderBy: { grantedAt: "desc" }, skip, take: pageSize }),
        prisma.rewardGrant.count({ where }),
      ]);
      return NextResponse.json({ items, pagination: pagination(page, pageSize, total) });
    }

    const where = {
      clientId, ...campaignFilter,
      ...(q ? { OR: [
        { participant: { name: { contains: q, mode: "insensitive" } } },
        { participant: { email: { contains: q, mode: "insensitive" } } },
        { reason: { contains: q, mode: "insensitive" } },
      ] } : {}),
    } satisfies Prisma.FraudCaseWhereInput;
    const [items, total] = await Promise.all([
      prisma.fraudCase.findMany({ where, select: { participant: { select: { name: true, email: true } }, reason: true, score: true, status: true, resolvedAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
      prisma.fraudCase.count({ where }),
    ]);
    return NextResponse.json({ items, pagination: pagination(page, pageSize, total) });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      const unauthenticated = error.message === "Não autenticado";
      return NextResponse.json(
        { error: unauthenticated ? "Não autenticado" : "Acesso negado" },
        { status: unauthenticated ? 401 : 403 },
      );
    }
    console.error("Falha ao carregar recurso administrativo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
