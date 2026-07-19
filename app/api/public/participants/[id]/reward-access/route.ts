import { NextResponse } from "next/server";
import {
  consumeRateLimit,
  envRateLimit,
  rateLimitExceeded,
  rateLimitHeaders,
  requestClientId,
} from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { hashValue } from "@/lib/security";
import { qualifyReferral } from "@/modules/growth-loop/domain/referral-service";

const REWARD_ACCESS_LIMIT = envRateLimit("GROWTH_LOOP_SENSITIVE_RATE_LIMIT_PER_MINUTE", 20);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rateLimit = await consumeRateLimit({
      scope: `reward-access:${id}`,
      subject: requestClientId(request),
      limit: REWARD_ACCESS_LIMIT,
    });
    if (!rateLimit.allowed) return rateLimitExceeded(rateLimit);

    const headers = rateLimitHeaders(rateLimit);
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: { grants: { include: { reward: true } }, referredBy: true },
    });
    if (!participant) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404, headers });
    }

    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!token || hashValue(token) !== participant.accessTokenHash) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403, headers });
    }

    await prisma.participant.update({
      where: { id },
      data: { initialRewardAccessedAt: new Date() },
    });
    if (participant.referredBy) await qualifyReferral(participant.referredBy.id);

    return NextResponse.json({
      rewards: participant.grants.map((grant) => ({
        id: grant.id,
        title: grant.reward.title,
        value: grant.reward.value,
        url: grant.reward.claimUrl,
      })),
    }, { headers });
  } catch (error) {
    console.error("Falha ao acessar recompensa:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
