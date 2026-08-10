import { z } from "zod";

import { decryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";

export type WhatsAppProvider = {
  name: string;
  send(input: { to: string; message: string }): Promise<{ providerId?: string }>;
};

export type StoredWhatsAppProvider = {
  version: 1;
  provider: "generic-http";
  apiUrl: string;
  apiToken?: string;
  instanceId?: string;
  credentialSource: "integration" | "environment";
};

export const whatsappProviderSchema = z.object({
  provider: z.literal("generic-http"),
  apiUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Use uma URL HTTPS."),
  apiToken: z.string().trim().min(12).max(1000).optional().or(z.literal("")),
  instanceId: z.string().trim().max(200).optional().or(z.literal("")),
});

function environmentConfig(): StoredWhatsAppProvider | null {
  const provider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  const apiUrl = process.env.WHATSAPP_API_URL?.trim();
  const apiToken = process.env.WHATSAPP_API_TOKEN?.trim();
  if (provider !== "generic-http" || !apiUrl || !apiToken) return null;
  return { version: 1, provider, apiUrl, apiToken, instanceId: process.env.WHATSAPP_INSTANCE_ID?.trim(), credentialSource: "environment" };
}

export async function loadWhatsAppProviderConfig(clientId: string) {
  const integration = await prisma.integration.findUnique({
    where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } },
    select: { encryptedConfig: true, active: true },
  });
  if (integration?.active) return decryptIntegrationConfig<StoredWhatsAppProvider>(integration.encryptedConfig);
  return environmentConfig();
}

export async function getWhatsAppProviderStatus(clientId: string) {
  const config = await loadWhatsAppProviderConfig(clientId);
  return {
    provider: config?.provider ?? null,
    configured: Boolean(config?.apiUrl && config.apiToken),
    apiUrl: config?.apiUrl ?? "",
    instanceId: config?.instanceId ?? "",
    credentialConfigured: Boolean(config?.apiToken),
    credentialSource: config?.credentialSource ?? null,
  };
}

export async function getWhatsAppProvider(clientId: string): Promise<WhatsAppProvider> {
  const config = await loadWhatsAppProviderConfig(clientId);
  if (!config?.apiUrl || !config.apiToken) throw new Error("Provider de WhatsApp não configurado");
  return {
    name: config.provider,
    async send({ to, message }) {
      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${config.apiToken}`, "content-type": "application/json" },
        body: JSON.stringify({ to, message, ...(config.instanceId ? { instanceId: config.instanceId } : {}) }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Provider de WhatsApp respondeu com status ${response.status}`);
      const result = await response.json().catch(() => ({})) as { id?: string; messageId?: string };
      return { providerId: result.messageId ?? result.id };
    },
  };
}
