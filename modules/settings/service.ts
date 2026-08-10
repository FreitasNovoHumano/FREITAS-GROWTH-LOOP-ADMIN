import { randomBytes } from "node:crypto";

import { decryptIntegrationConfig, encryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";
import { emailFromEnvironment, type StoredEmailProvider } from "@/modules/growth-loop/email/provider";
import { loadWhatsAppProviderConfig, type StoredWhatsAppProvider } from "@/modules/growth-loop/notifications/whatsapp-provider";
import type { BrandingInput, IntegrationSettingsInput, NotificationSettingsInput } from "@/modules/settings/schemas";
import { maskSecret } from "@/modules/settings/schemas";

export const defaultNotificationEvents = ["lead.created"];

export async function getBranding(clientId: string) {
  const [client, settings] = await Promise.all([
    prisma.client.findUniqueOrThrow({ where: { id: clientId }, select: { name: true, company: true } }),
    prisma.clientSettings.findUnique({ where: { clientId } }),
  ]);
  return {
    brandName: settings?.brandName ?? client.company ?? client.name,
    logoUrl: settings?.logoUrl ?? "",
    faviconUrl: settings?.faviconUrl ?? "",
    primaryColor: settings?.primaryColor ?? "#7650e8",
    secondaryColor: settings?.secondaryColor ?? "#a989ff",
    backgroundColor: settings?.backgroundColor ?? "#f7f7fb",
    textColor: settings?.textColor ?? "#17151f",
    buttonStyle: settings?.buttonStyle ?? "ROUNDED",
  } satisfies BrandingInput;
}

export async function saveBranding(clientId: string, input: BrandingInput) {
  return prisma.clientSettings.upsert({
    where: { clientId },
    update: { ...input, logoUrl: input.logoUrl || null, faviconUrl: input.faviconUrl || null },
    create: {
      clientId,
      ...input,
      logoUrl: input.logoUrl || null,
      faviconUrl: input.faviconUrl || null,
      notificationEvents: defaultNotificationEvents,
    },
  });
}

async function storedEmailIntegration(clientId: string) {
  const integration = await prisma.integration.findUnique({
    where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
  });
  return {
    integration,
    config: integration ? decryptIntegrationConfig<StoredEmailProvider>(integration.encryptedConfig) : null,
  };
}

export async function getIntegrationSettings(clientId: string) {
  const [{ integration: emailIntegration, config: email }, whatsappIntegration, whatsapp, webhook] = await Promise.all([
    storedEmailIntegration(clientId),
    prisma.integration.findUnique({ where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } } }),
    loadWhatsAppProviderConfig(clientId),
    prisma.webhookEndpoint.findFirst({ where: { clientId }, orderBy: { createdAt: "asc" } }),
  ]);
  const environmentEmail = emailFromEnvironment();
  return {
    email: {
      provider: "Resend",
      senderName: email?.senderName ?? environmentEmail.senderName,
      senderEmail: email?.senderEmail ?? environmentEmail.senderEmail,
      active: emailIntegration?.active ?? Boolean(process.env.RESEND_API_KEY),
      configured: Boolean((email?.apiKey ?? process.env.RESEND_API_KEY) && (email?.senderEmail ?? environmentEmail.senderEmail)),
      credentialSource: email?.credentialSource ?? (process.env.RESEND_API_KEY ? "environment" : null),
    },
    whatsapp: {
      provider: "generic-http" as const,
      apiUrl: whatsapp?.apiUrl ?? "",
      instanceId: whatsapp?.instanceId ?? "",
      active: whatsappIntegration?.active ?? Boolean(whatsapp),
      configured: Boolean(whatsapp?.apiUrl && whatsapp.apiToken),
      credentialSource: whatsapp?.credentialSource ?? null,
    },
    webhook: {
      url: webhook?.url ?? "",
      active: webhook?.active ?? false,
      events: webhook?.events ?? [],
      configured: Boolean(webhook?.url),
    },
    crm: { provider: null, configured: false, available: false },
    automations: {
      email: Boolean((email?.apiKey ?? process.env.RESEND_API_KEY) && (email?.senderEmail ?? environmentEmail.senderEmail)),
      whatsapp: Boolean(whatsapp?.apiUrl && whatsapp.apiToken),
      webhook: Boolean(webhook?.url && webhook.active),
    },
  };
}

export async function saveIntegrationSettings(clientId: string, userId: string, input: IntegrationSettingsInput) {
  const { integration: emailIntegration, config: previousEmail } = await storedEmailIntegration(clientId);
  const environmentEmail = emailFromEnvironment();
  const emailConfig: StoredEmailProvider = {
    version: 1,
    senderName: input.email.senderName,
    senderEmail: input.email.senderEmail.toLowerCase(),
    ...(previousEmail?.apiKey ? { apiKey: previousEmail.apiKey } : {}),
    credentialSource: previousEmail?.apiKey ? "integration" : "environment",
  };
  await prisma.integration.upsert({
    where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
    update: { encryptedConfig: encryptIntegrationConfig(emailConfig), active: input.email.active },
    create: { clientId, provider: "RESEND", name: "DEFAULT", encryptedConfig: encryptIntegrationConfig(emailConfig), active: input.email.active },
  });

  const whatsappIntegration = await prisma.integration.findUnique({
    where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } },
  });
  const previousWhatsApp = whatsappIntegration
    ? decryptIntegrationConfig<StoredWhatsAppProvider>(whatsappIntegration.encryptedConfig)
    : await loadWhatsAppProviderConfig(clientId);
  if (input.whatsapp.apiUrl || whatsappIntegration) {
    const whatsappConfig: StoredWhatsAppProvider = {
      version: 1,
      provider: "generic-http",
      apiUrl: input.whatsapp.apiUrl,
      instanceId: input.whatsapp.instanceId || undefined,
      ...(previousWhatsApp?.apiToken ? { apiToken: previousWhatsApp.apiToken } : {}),
      credentialSource: previousWhatsApp?.credentialSource ?? "environment",
    };
    await prisma.integration.upsert({
      where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } },
      update: { encryptedConfig: encryptIntegrationConfig(whatsappConfig), active: input.whatsapp.active },
      create: { clientId, provider: "WHATSAPP", name: "DEFAULT", encryptedConfig: encryptIntegrationConfig(whatsappConfig), active: input.whatsapp.active },
    });
  }

  const webhook = await prisma.webhookEndpoint.findFirst({ where: { clientId }, orderBy: { createdAt: "asc" } });
  if (input.webhook.url) {
    const data = { url: input.webhook.url, active: input.webhook.active, events: input.webhook.events };
    if (webhook) await prisma.webhookEndpoint.update({ where: { id: webhook.id }, data });
    else await prisma.webhookEndpoint.create({ data: { clientId, ...data, encryptedSecret: encryptIntegrationConfig({ secret: randomBytes(32).toString("base64url") }) } });
  } else if (webhook) {
    await prisma.webhookEndpoint.update({ where: { id: webhook.id }, data: { active: false, events: [] } });
  }

  await prisma.auditLog.create({ data: {
    clientId, actorId: userId, actorType: "USER", action: "SETTINGS_INTEGRATIONS_UPDATED",
    entityType: "Client", entityId: clientId,
    metadata: { emailActive: input.email.active, whatsappActive: input.whatsapp.active, webhookActive: input.webhook.active, environmentEmail: Boolean(environmentEmail.senderEmail), previousEmailIntegration: Boolean(emailIntegration) },
  } });
  return getIntegrationSettings(clientId);
}

export async function getSecretSettings(clientId: string) {
  const [{ config: email }, whatsapp] = await Promise.all([storedEmailIntegration(clientId), loadWhatsAppProviderConfig(clientId)]);
  const resend = email?.apiKey ?? process.env.RESEND_API_KEY;
  const whatsappToken = whatsapp?.apiToken;
  return {
    resendApiKey: { configured: Boolean(resend), masked: maskSecret(resend), source: email?.apiKey ? "integration" : resend ? "environment" : null },
    whatsappApiToken: { configured: Boolean(whatsappToken), masked: maskSecret(whatsappToken), source: whatsapp?.credentialSource ?? null },
  };
}

export async function saveSecret(clientId: string, userId: string, key: "resendApiKey" | "whatsappApiToken", value: string) {
  if (key === "resendApiKey") {
    const { config } = await storedEmailIntegration(clientId);
    const environmentEmail = emailFromEnvironment();
    const next: StoredEmailProvider = {
      version: 1,
      senderName: config?.senderName || environmentEmail.senderName || "Freitas Growth Loop",
      senderEmail: config?.senderEmail || environmentEmail.senderEmail,
      apiKey: value,
      credentialSource: "integration",
    };
    if (!next.senderEmail) throw new Error("Configure o remetente em Integrações antes de salvar a chave.");
    await prisma.integration.upsert({
      where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
      update: { encryptedConfig: encryptIntegrationConfig(next) },
      create: { clientId, provider: "RESEND", name: "DEFAULT", encryptedConfig: encryptIntegrationConfig(next), active: true },
    });
  } else {
    const integration = await prisma.integration.findUnique({ where: { clientId_provider_name: { clientId, provider: "WHATSAPP", name: "DEFAULT" } } });
    const config = integration ? decryptIntegrationConfig<StoredWhatsAppProvider>(integration.encryptedConfig) : null;
    if (!integration || !config?.apiUrl) throw new Error("Configure a URL do WhatsApp em Integrações antes de salvar o token.");
    await prisma.integration.update({
      where: { id: integration.id },
      data: { encryptedConfig: encryptIntegrationConfig({ ...config, apiToken: value, credentialSource: "integration" }) },
    });
  }
  await prisma.auditLog.create({ data: {
    clientId, actorId: userId, actorType: "USER", action: "INTEGRATION_SECRET_UPDATED",
    entityType: "Integration", entityId: clientId, metadata: { key },
  } });
  return getSecretSettings(clientId);
}

export async function getNotificationSettings(clientId: string) {
  const settings = await prisma.clientSettings.findUnique({ where: { clientId }, select: { notificationPanelEnabled: true, notificationEvents: true } });
  return { panelEnabled: settings?.notificationPanelEnabled ?? true, events: settings?.notificationEvents ?? defaultNotificationEvents };
}

export async function saveNotificationSettings(clientId: string, input: NotificationSettingsInput) {
  const branding = await getBranding(clientId);
  await prisma.clientSettings.upsert({
    where: { clientId },
    update: { notificationPanelEnabled: input.panelEnabled, notificationEvents: input.events },
    create: { clientId, ...branding, logoUrl: branding.logoUrl || null, faviconUrl: branding.faviconUrl || null, notificationPanelEnabled: input.panelEnabled, notificationEvents: input.events },
  });
  return getNotificationSettings(clientId);
}
