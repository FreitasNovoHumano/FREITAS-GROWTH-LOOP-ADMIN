import { Message, SMTPClient } from "emailjs";

type EmailAddress = string | { name: string; address: string };

export type TransactionalEmail = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
};

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 65_535 ? parsed : fallback;
}

function booleanValue(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === "true";
}

function formatAddress(address: EmailAddress) {
  return typeof address === "string" ? address : `${address.name} <${address.address}>`;
}

function formatRecipients(addresses: EmailAddress | EmailAddress[]) {
  return (Array.isArray(addresses) ? addresses : [addresses]).map(formatAddress);
}

function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim() || (process.env.NODE_ENV === "production" ? "" : "127.0.0.1");
  if (!host) throw new Error("SMTP_HOST não configurado.");

  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASS;
  if ((user && !password) || (!user && password)) {
    throw new Error("SMTP_USER e SMTP_PASS devem ser configurados em conjunto.");
  }

  return {
    host,
    port: positiveInteger(process.env.SMTP_PORT, 1025),
    ssl: booleanValue(process.env.SMTP_SECURE, false),
    tls: booleanValue(process.env.SMTP_STARTTLS, false),
    user: user ?? "",
    password: password ?? "",
    timeout: positiveInteger(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10_000),
  };
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(input: TransactionalEmail) {
  const client = new SMTPClient(smtpConfiguration());
  const recipients = formatRecipients(input.to);

  try {
    const sent = await client.sendAsync({
      from: process.env.EMAIL_FROM ?? "Growth Loop <growth-loop@localhost>",
      to: recipients,
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { "reply-to": formatAddress(input.replyTo) } : {}),
      attachment: [{ data: input.html, alternative: true, type: "text/html; charset=utf-8" }],
    });
    const messageId = sent instanceof Message ? sent.header["message-id"] : sent["message-id"];

    return {
      messageId: typeof messageId === "string" ? messageId : undefined,
      accepted: recipients,
      rejected: [] as string[],
      previewUrl: process.env.EMAIL_PREVIEW_URL
        ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:1080"),
    };
  } finally {
    client.smtp.close();
  }
}
