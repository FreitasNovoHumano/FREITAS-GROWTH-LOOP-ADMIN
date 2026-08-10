import { z } from "zod";

export const settingsPaths = [
  "/dashboard/settings/branding",
  "/dashboard/settings/integrations",
  "/dashboard/settings/security",
  "/dashboard/settings/secrets",
  "/dashboard/settings/notifications",
] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal com 6 dígitos.");
const optionalHttpsUrl = z.string().trim().max(500).refine(
  (value) => !value || value.startsWith("https://"),
  "Use uma URL HTTPS.",
);

export const brandingSchema = z.object({
  brandName: z.string().trim().min(2).max(120),
  logoUrl: optionalHttpsUrl,
  faviconUrl: optionalHttpsUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  buttonStyle: z.enum(["ROUNDED", "PILL", "SQUARE"]),
});

export const integrationSettingsSchema = z.object({
  email: z.object({
    senderName: z.string().trim().min(2).max(120),
    senderEmail: z.string().trim().email().max(200),
    active: z.boolean(),
  }),
  whatsapp: z.object({
    provider: z.literal("generic-http"),
    apiUrl: optionalHttpsUrl,
    instanceId: z.string().trim().max(200),
    active: z.boolean(),
  }),
  webhook: z.object({
    url: optionalHttpsUrl,
    active: z.boolean(),
    events: z.array(z.enum([
      "ParticipantRegistered",
      "ReferralQualified",
      "RewardUnlocked",
      "AutomationFailed",
    ])).max(4),
  }),
});

export const secretSettingsSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("resendApiKey"), value: z.string().trim().min(20).max(500) }),
  z.object({ key: z.literal("whatsappApiToken"), value: z.string().trim().min(12).max(1000) }),
]);

export const notificationSettingsSchema = z.object({
  panelEnabled: z.boolean(),
  events: z.array(z.enum([
    "lead.created",
    "campaign.created",
    "campaign.activated",
    "campaign.paused",
    "email.failed",
    "whatsapp.failed",
  ])).max(6),
});

export const notificationEventOptions = [
  { key: "lead.created", label: "Novo lead ou participante", description: "Quando alguém conclui a entrada em uma campanha." },
  { key: "campaign.created", label: "Campanha criada", description: "Quando uma nova campanha é criada." },
  { key: "campaign.activated", label: "Campanha ativada", description: "Quando uma campanha passa a receber participantes." },
  { key: "campaign.paused", label: "Campanha pausada", description: "Quando uma campanha deixa de receber entradas." },
  { key: "email.failed", label: "Falha em e-mail", description: "Quando uma automação de e-mail falha." },
  { key: "whatsapp.failed", label: "Falha em WhatsApp", description: "Quando uma automação de WhatsApp falha." },
] as const;

export type BrandingInput = z.infer<typeof brandingSchema>;
export type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;

export function maskSecret(value?: string | null) {
  if (!value) return null;
  return `${"•".repeat(12)}${value.slice(-4)}`;
}

export function settingsTenantWhere(clientId: string) {
  return { clientId };
}
