import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { maskWhatsAppNumber, parseWhatsAppNumbers } from "@/modules/growth-loop/notifications/whatsapp-numbers";
import { sendWhatsApp } from "@/modules/growth-loop/notifications/whatsapp-service";

const testSchema = z.object({
  numbers: z.string().trim().min(10).max(500),
  message: z.string().trim().min(3).max(500).default("Teste de configuração do Freitas Growth Loop."),
});

export async function POST(request: Request) {
  try {
    const { clientId, userId } = await requireAdminTenant();
    const input = testSchema.parse(await request.json());
    const numbers = parseWhatsAppNumbers(input.numbers);
    if (!numbers.length) return NextResponse.json({ error: "Informe ao menos um número válido com código do país." }, { status: 400 });
    const results = await sendWhatsApp({ clientId, to: numbers, message: input.message });
    await prisma.auditLog.create({ data: {
      clientId,
      actorId: userId,
      actorType: "USER",
      action: "WHATSAPP_PROVIDER_TESTED",
      entityType: "Integration",
      entityId: "WHATSAPP",
      metadata: {
        recipients: results.map((result) => maskWhatsAppNumber(result.number)),
        sent: results.filter((result) => result.status === "sent").length,
        failed: results.filter((result) => result.status === "failed").length,
      },
    } });
    return NextResponse.json({ results: results.map((result) => ({ ...result, number: maskWhatsAppNumber(result.number) })) });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Revise os números e a mensagem de teste." }, { status: 400 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível testar o WhatsApp." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
