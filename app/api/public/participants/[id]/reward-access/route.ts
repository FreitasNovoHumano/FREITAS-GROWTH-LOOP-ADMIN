import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qualifyReferral } from "@/modules/growth-loop/domain/referral-service";
import { hashValue } from "@/lib/security";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await prisma.participant.findUnique({ where: { id }, include: { grants: { include: { reward: true } }, referredBy: true } });
  if (!participant) return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || hashValue(token) !== participant.accessTokenHash) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  await prisma.participant.update({ where: { id }, data: { initialRewardAccessedAt: new Date() } });
  if (participant.referredBy) await qualifyReferral(participant.referredBy.id);
  return NextResponse.json({ rewards: participant.grants.map(g => ({ id: g.id, title: g.reward.title, value: g.reward.value, url: g.reward.claimUrl })) });
}
