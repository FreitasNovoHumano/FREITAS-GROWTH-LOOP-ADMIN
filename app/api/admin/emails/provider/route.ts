import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { decryptIntegrationConfig, encryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";
import { emailProviderSchema, type StoredEmailProvider } from "@/modules/growth-loop/email/provider";

export async function PUT(request: Request) {
  try {
    const input = emailProviderSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    const existing = await prisma.integration.findUnique({
      where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
      select: { id: true, encryptedConfig: true },
    });
    const previous = existing
      ? decryptIntegrationConfig<StoredEmailProvider>(existing.encryptedConfig)
      : null;
    const apiKey = input.apiKey || previous?.apiKey;
    if (!apiKey && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Informe uma API key do Resend." }, { status: 400 });
    }

    const config: StoredEmailProvider = {
      version: 1,
      senderName: input.senderName,
      senderEmail: input.senderEmail.toLowerCase(),
      ...(apiKey ? { apiKey } : {}),
      credentialSource: apiKey ? "integration" : "environment",
    };
    const encryptedConfig = encryptIntegrationConfig(config);
    const integration = await prisma.integration.upsert({
      where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
      update: { encryptedConfig, active: true },
      create: { clientId, provider: "RESEND", name: "DEFAULT", encryptedConfig, active: true },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: {
        clientId,
        actorId: userId,
        actorType: "USER",
        action: "EMAIL_PROVIDER_UPDATED",
        entityType: "Integration",
        entityId: integration.id,
        metadata: { provider: "RESEND", senderEmail: config.senderEmail, credentialUpdated: Boolean(input.apiKey) },
      },
    });

    return NextResponse.json({
      provider: "Resend",
      configured: true,
      senderName: config.senderName,
      senderEmail: config.senderEmail,
      credentialConfigured: true,
      credentialSource: config.credentialSource,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Revise os dados do provedor.", fields: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar o provedor." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
