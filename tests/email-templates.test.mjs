import assert from "node:assert/strict";
import test from "node:test";

import {
  emailTemplateDefinitions,
  emailTemplateKeys,
  hydrateTemplate,
  serializeTemplate,
  templateInputSchema,
} from "../modules/growth-loop/email/templates.ts";
import { decryptIntegrationConfig, encryptIntegrationConfig } from "../lib/integration-crypto.ts";
import { parseWhatsAppNumbers } from "../modules/growth-loop/notifications/whatsapp-numbers.ts";
import { sendWhatsAppBatch } from "../modules/growth-loop/notifications/whatsapp-batch.ts";
import { deliveryIdempotencyKey } from "../modules/growth-loop/notifications/delivery-key.ts";

test("mantém os quatro identificadores estáveis e únicos", () => {
  assert.deepEqual(emailTemplateKeys, [
    "WELCOME_INITIAL_REWARD",
    "REFERRAL_INVITE",
    "PARTICIPANT_PROGRESS",
    "REWARD_UNLOCKED",
  ]);
  assert.equal(new Set(emailTemplateKeys).size, 4);
});

test("serializa e recupera os campos editáveis sem aceitar HTML do usuário", () => {
  const template = {
    ...emailTemplateDefinitions.WELCOME_INITIAL_REWARD.defaults,
    title: "Olá <script>alert(1)</script>",
  };
  const html = serializeTemplate(template);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(hydrateTemplate(template.key, { subject: template.subject, html, active: true }).title, template.title);
});

test("rejeita variável não suportada pelo gatilho", () => {
  const input = {
    ...emailTemplateDefinitions.REFERRAL_INVITE.defaults,
    body: "Olá {{reward_name}}",
  };
  assert.equal(templateInputSchema(input.key).safeParse(input).success, false);
});

test("aceita somente HTTPS ou variável de link permitida no botão", () => {
  const defaults = emailTemplateDefinitions.PARTICIPANT_PROGRESS.defaults;
  assert.equal(templateInputSchema(defaults.key).safeParse(defaults).success, true);
  assert.equal(templateInputSchema(defaults.key).safeParse({ ...defaults, buttonUrl: "javascript:alert(1)" }).success, false);
});

test("criptografa a credencial de integração em repouso", () => {
  const previousKey = process.env.INTEGRATION_ENCRYPTION_KEY;
  process.env.INTEGRATION_ENCRYPTION_KEY = "test-only-encryption-key-with-32-characters";
  try {
    const encrypted = encryptIntegrationConfig({ apiKey: "re_test_secret_value", senderEmail: "teste@example.com" });
    assert.doesNotMatch(encrypted, /re_test_secret_value/);
    assert.deepEqual(decryptIntegrationConfig(encrypted), { apiKey: "re_test_secret_value", senderEmail: "teste@example.com" });
  } finally {
    if (previousKey === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY;
    else process.env.INTEGRATION_ENCRYPTION_KEY = previousKey;
  }
});

test("mantém WhatsApp desativado ao carregar metadata anterior", () => {
  const defaults = emailTemplateDefinitions.REFERRAL_INVITE.defaults;
  const legacyMetadata = Buffer.from(JSON.stringify({
    version: 1,
    title: defaults.title,
    body: defaults.body,
    buttonText: defaults.buttonText,
    buttonUrl: defaults.buttonUrl,
  })).toString("base64url");
  const hydrated = hydrateTemplate(defaults.key, {
    subject: defaults.subject,
    html: `<!--fgl-template:${legacyMetadata}--><h1>Convite</h1>`,
    active: true,
  });
  assert.equal(hydrated.active, true);
  assert.equal(hydrated.whatsappEnabled, false);
});

test("normaliza, separa e elimina números de WhatsApp duplicados", () => {
  assert.deepEqual(
    parseWhatsAppNumbers("55 (11) 99999-9999; 55 (21) 98888-8888, 5511999999999; ;"),
    ["5511999999999", "5521988888888"],
  );
  assert.deepEqual(parseWhatsAppNumbers(["+55 31 97777-7777", "123", ""]), ["5531977777777"]);
});

test("valida variáveis também na mensagem de WhatsApp", () => {
  const defaults = emailTemplateDefinitions.REWARD_UNLOCKED.defaults;
  assert.equal(templateInputSchema(defaults.key).safeParse({ ...defaults, whatsappEnabled: true }).success, true);
  assert.equal(templateInputSchema(defaults.key).safeParse({ ...defaults, whatsappEnabled: true, whatsappMessage: "{{unknown}}" }).success, false);
});

test("envia cada número isoladamente sem interromper os demais", async () => {
  const provider = {
    async send({ to }) {
      if (to.endsWith("8888")) throw new Error("indisponível");
      return { providerId: `provider-${to}` };
    },
  };
  const results = await sendWhatsAppBatch(["5511999999999", "5521988888888"], "Teste", provider);
  assert.deepEqual(results.map((result) => result.status), ["sent", "failed"]);
  assert.equal(results[0].providerId, "provider-5511999999999");
  assert.equal(results[1].error, "indisponível");
});

test("chave idempotente separa evento, canal e destinatário", () => {
  assert.equal(deliveryIdempotencyKey("event-1", "WHATSAPP", "hash-a"), "event-1:WHATSAPP:hash-a");
  assert.notEqual(deliveryIdempotencyKey("event-1", "EMAIL", "hash-a"), deliveryIdempotencyKey("event-1", "WHATSAPP", "hash-a"));
});
