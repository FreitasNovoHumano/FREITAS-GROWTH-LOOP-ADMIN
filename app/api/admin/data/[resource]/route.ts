import { NextResponse } from "next/server";

import {
  AuthorizationError,
  requireAdminTenant,
} from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const { clientId } = await requireAdminTenant();

    if (resource === "leads") {
      return NextResponse.json(
        await prisma.lead.findMany({
          where: { clientId },
          include: { campaign: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      );
    }
    if (resource === "participants") {
      return NextResponse.json(
        await prisma.participant.findMany({
          where: { clientId },
          include: {
            campaign: { select: { name: true } },
            _count: { select: { referrals: true, grants: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      );
    }
    if (resource === "rewards") {
      return NextResponse.json(
        await prisma.rewardGrant.findMany({
          where: { clientId },
          include: {
            participant: { select: { name: true, email: true } },
            reward: { select: { title: true, kind: true } },
          },
          orderBy: { grantedAt: "desc" },
          take: 200,
        }),
      );
    }
    if (resource === "fraud") {
      return NextResponse.json(
        await prisma.fraudCase.findMany({
          where: { clientId },
          include: { participant: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      );
    }
    return NextResponse.json({ error: "Recurso inválido." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AuthorizationError
            ? "Acesso negado."
            : "Não foi possível carregar os dados.",
      },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
