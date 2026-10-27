import { NextResponse } from "next/server";

import { verifyParticipantAccessSignature } from "@/lib/participant-link";
import { prisma } from "@/lib/prisma";
import { qualifyReferral } from "@/modules/growth-loop/domain/referral-service";

export const dynamic = "force-dynamic";

function textResponse(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const signature = new URL(request.url).searchParams.get("sig") ?? "";
  if (!verifyParticipantAccessSignature(id, signature)) {
    return textResponse("Link inválido.", 403);
  }

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: {
      referredBy: { select: { id: true } },
      campaign: {
        select: {
          slug: true,
          rewards: { where: { key: "INITIAL" }, select: { claimUrl: true } },
        },
      },
    },
  });
  if (!participant) return textResponse("Participante não encontrado.", 404);

  const now = new Date();
  await prisma.participant.update({
    where: { id },
    data: {
      emailVerifiedAt: participant.emailVerifiedAt ?? now,
      initialRewardAccessedAt: participant.initialRewardAccessedAt ?? now,
    },
  });

  if (participant.referredBy) {
    await qualifyReferral(participant.referredBy.id).catch((error) => {
      console.error(
        "growth_loop_referral_qualification_failed",
        error instanceof Error ? error.message : "unknown",
      );
    });
  }

  const claimUrl = participant.campaign.rewards[0]?.claimUrl;
  const destination =
    claimUrl && /^https?:\/\//i.test(claimUrl)
      ? claimUrl
      : `/growth-loop/${participant.campaign.slug}?${new URLSearchParams({
          clientId: participant.clientId,
          confirmed: "1",
        })}`;

  return NextResponse.redirect(new URL(destination, request.url));
}
