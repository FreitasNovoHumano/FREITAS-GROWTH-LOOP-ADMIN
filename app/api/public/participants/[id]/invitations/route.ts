import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { hashValue } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { createInvitation } from "@/modules/growth-loop/domain/invitation-service";
import { invitationSchema } from "@/modules/growth-loop/schemas/invitation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participant = await prisma.participant.findUnique({ where: { id }, select: { accessTokenHash: true } });
    if (!participant) return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!token || hashValue(token) !== participant.accessTokenHash) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const input = invitationSchema.parse(await request.json());
    const result = await createInvitation({ inviterId: id, email: input.email, phone: input.phone });
    return NextResponse.json({ id: result.invitation.id, status: result.invitation.status, created: result.created }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Revise os dados do convite.", fields: error.flatten().fieldErrors }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar o convite." }, { status: 400 });
  }
}
