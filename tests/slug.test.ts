import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCampaignSlug } from "../lib/slug";
import { campaignSchema } from "../modules/growth-loop/schemas/campaign";

const validCampaign = {
  name: "Indique e Ganhe",
  slug: "indique-e-ganhe",
  description: "Campanha de indicação",
  initialRewardTitle: "Guia exclusivo",
  initialRewardValue: "Acesso imediato",
  milestoneRewardTitle: "Consultoria estratégica",
  milestoneRewardValue: "Sessão de 45 minutos",
  qualifiedReferralGoal: 3,
  primaryColor: "#7c3aed",
};

test("slug remove acentos, espaços e caracteres inválidos", () => {
  assert.equal(normalizeCampaignSlug("  Indicação & Prêmios 2026!  "), "indicacao-premios-2026");
  assert.equal(normalizeCampaignSlug("minha---campanha"), "minha-campanha");
});

test("slug extrai o identificador quando uma URL pública é colada", () => {
  assert.equal(
    normalizeCampaignSlug(
      "https://loop.example.com/growth-loop/Indique%20e%20Ganhe?origem=painel",
    ),
    "indique-e-ganhe",
  );
});

test("schema normaliza o slug no backend antes de validar", () => {
  const parsed = campaignSchema.parse({
    ...validCampaign,
    slug: "Campanha de Verão 2026",
  });
  assert.equal(parsed.slug, "campanha-de-verao-2026");
});

test("schema rejeita slug vazio depois da normalização", () => {
  assert.throws(() => campaignSchema.parse({ ...validCampaign, slug: "---" }));
});
