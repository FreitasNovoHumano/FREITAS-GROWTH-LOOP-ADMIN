import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { decryptIntegrationConfig, encryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";
import { whatsappProviderSchema, type StoredWhatsAppProvider } from "@/modules/growth-loop/notifications/whatsapp-provider";

export async function PUT(request: Request) {
  try {
    const input = whatsappProviderSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    const existing = await prisma.integration.findUnique({
      where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } },
      select: { id: true, encryptedConfig: true },
    });
    const previous = existing ? decryptIntegrationConfig<StoredWhatsAppProvider>(existing.encryptedConfig) : null;
    const apiToken = input.apiToken || previous?.apiToken || process.env.WHATSAPP_API_TOKEN;
    if (!apiToken) return NextResponse.json({ error: "Informe o token do provider de WhatsApp." }, { status: 400 });
    const config: StoredWhatsAppProvider = {
      version: 1,
      provider: input.provider,
      apiUrl: input.apiUrl,
      apiToken,
      instanceId: input.instanceId || undefined,
      credentialSource: input.apiToken ? "integration" : previous?.credentialSource ?? "environment",
    };
    const integration = await prisma.integration.upsert({
      where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } },
      update: { encryptedConfig: encryptIntegrationConfig(config), active: true },
      create: { clientId, provider: "WHATSAPP", name: "DEFAULT", encryptedConfig: encryptIntegrationConfig(config), active: true },
      select: { id: true },
    });
    await prisma.auditLog.create({ data: {
      clientId, actorId: userId, actorType: "USER", action: "WHATSAPP_PROVIDER_UPDATED",
      entityType: "Integration", entityId: integration.id,
      metadata: { provider: config.provider, apiHost: new URL(config.apiUrl).host, credentialUpdated: Boolean(input.apiToken) },
    } });
    return NextResponse.json({
      provider: config.provider,
      configured: true,
      apiUrl: config.apiUrl,
      instanceId: config.instanceId ?? "",
      credentialConfigured: true,
      credentialSource: config.credentialSource,
    });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Revise a configuração do WhatsApp." }, { status: 400 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar o provider de WhatsApp." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
