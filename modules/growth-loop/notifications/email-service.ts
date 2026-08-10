import { Resend } from "resend";

import { decryptIntegrationConfig } from "@/lib/integration-crypto";
import { prisma } from "@/lib/prisma";
import { emailFromEnvironment, type StoredEmailProvider } from "@/modules/growth-loop/email/provider";

export async function sendEmail(input: { clientId: string; to: string; subject: string; html: string }) {
  const integration = await prisma.integration.findUnique({
    where: { clientId_provider_name: { clientId: input.clientId, provider: "RESEND", name: "DEFAULT" } },
    select: { encryptedConfig: true, active: true },
  });
  const stored = integration?.active ? decryptIntegrationConfig<StoredEmailProvider>(integration.encryptedConfig) : null;
  const apiKey = stored?.apiKey ?? process.env.RESEND_API_KEY;
  const environment = emailFromEnvironment();
  const senderName = stored?.senderName ?? environment.senderName;
  const senderEmail = stored?.senderEmail ?? environment.senderEmail;
  if (!apiKey || !senderEmail) throw new Error("Provider de e-mail não configurado");

  const response = await new Resend(apiKey).emails.send({
    from: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (response.error) throw new Error(`Falha no provider de e-mail: ${response.error.name}`);
  return { providerId: response.data?.id };
}
