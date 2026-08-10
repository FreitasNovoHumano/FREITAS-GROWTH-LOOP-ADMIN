import { NextResponse } from "next/server";

import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { decryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";
import { emailFromEnvironment, type StoredEmailProvider } from "@/modules/growth-loop/email/provider";
import {
  emailTemplateDefinitions,
  emailTemplateKeys,
  hydrateTemplate,
} from "@/modules/growth-loop/email/templates";

export async function GET() {
  try {
    const { clientId } = await requireAdminTenant();
    const [integration, storedTemplates] = await Promise.all([
      prisma.integration.findUnique({
        where: { clientId_provider_name: { clientId, provider: "RESEND", name: "DEFAULT" } },
        select: { encryptedConfig: true, active: true },
      }),
      prisma.emailTemplate.findMany({
        where: { clientId, campaignId: null, key: { in: [...emailTemplateKeys] } },
        select: { key: true, subject: true, html: true, active: true },
      }),
    ]);

    const environment = emailFromEnvironment();
    const provider = integration
      ? decryptIntegrationConfig<StoredEmailProvider>(integration.encryptedConfig)
      : null;
    const templates = emailTemplateKeys.map((key) => {
      const definition = emailTemplateDefinitions[key];
      const stored = storedTemplates.find((template) => template.key === key);
      return {
        ...hydrateTemplate(key, stored),
        name: definition.name,
        description: definition.description,
        trigger: definition.trigger,
        variables: definition.variables,
      };
    });

    return NextResponse.json({
      provider: {
        provider: "Resend",
        configured: Boolean(
          integration?.active && provider && (provider.apiKey || process.env.RESEND_API_KEY),
        ),
        senderName: provider?.senderName ?? environment.senderName,
        senderEmail: provider?.senderEmail ?? environment.senderEmail,
        credentialConfigured: Boolean(provider?.apiKey || process.env.RESEND_API_KEY),
        credentialSource: provider?.credentialSource ?? (process.env.RESEND_API_KEY ? "environment" : null),
      },
      templates,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível carregar as configurações de e-mail." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
