import path from "node:path";
import dotenv from "dotenv";
import { Message, SMTPClient } from "emailjs";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const host = process.env.SMTP_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.SMTP_PORT ?? 1025);
const ssl = process.env.SMTP_SECURE?.trim().toLowerCase() === "true";
const tls = process.env.SMTP_STARTTLS?.trim().toLowerCase() === "true";
const user = process.env.SMTP_USER?.trim();
const password = process.env.SMTP_PASS;

if ((user && !password) || (!user && password)) {
  throw new Error("SMTP_USER e SMTP_PASS devem ser configurados em conjunto.");
}

const client = new SMTPClient({ host, port, ssl, tls, user, password });

try {
  const sent = await client.sendAsync({
    from: process.env.EMAIL_FROM ?? "Growth Loop <growth-loop@localhost>",
    to: process.env.EMAIL_TEST_TO ?? "preview@localhost",
    subject: "Teste local — Freitas Growth Loop",
    text: "O transporte SMTP do Freitas Growth Loop está funcionando.",
    attachment: [{
      data: "<h1>SMTP funcionando</h1><p>O transporte de e-mail do <strong>Freitas Growth Loop</strong> está configurado corretamente.</p>",
      alternative: true,
      type: "text/html; charset=utf-8",
    }],
  });
  const messageId = sent instanceof Message ? sent.header["message-id"] : sent["message-id"];
  console.log(`E-mail de teste enviado. messageId=${messageId ?? "não informado"}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`Visualize em ${process.env.EMAIL_PREVIEW_URL ?? "http://localhost:1080"}`);
  }
} finally {
  client.smtp.close();
}
