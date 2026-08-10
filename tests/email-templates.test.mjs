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
