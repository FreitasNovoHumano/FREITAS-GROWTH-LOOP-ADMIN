import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEmbedSnippet,
  createPublicClientToken,
  verifyPublicClientToken,
} from "../lib/embed";
import { resolveEmbedConfiguration } from "../lib/embed-config";
import { growthLoopEmbedScript } from "../lib/embed-script";
import { publicCampaignWhere } from "../lib/public-campaign";

const clientId = "507f1f77bcf86cd799439011";
const secret = "segredo-de-teste-do-embed";

test("token público identifica a empresa e rejeita adulteração", () => {
  const token = createPublicClientToken(clientId, secret);

  assert.equal(verifyPublicClientToken(token, secret), clientId);
  assert.equal(verifyPublicClientToken(`${token}x`, secret), null);
  assert.equal(verifyPublicClientToken(token, "outro-segredo"), null);
});

test("snippet usa embed.js assíncrono e identifica campanha e empresa", () => {
  const token = createPublicClientToken(clientId, secret);
  const snippet = buildEmbedSnippet(
    "https://loop.example.com/painel",
    token,
    "indique-e-ganhe",
  );

  assert.match(snippet, /^<script async /);
  assert.match(snippet, /src="https:\/\/loop\.example\.com\/embed\.js"/);
  assert.match(snippet, new RegExp(`data-growth-loop-token="${token}"`));
  assert.match(snippet, /data-growth-loop-campaign="indique-e-ganhe"/);
});

test("embed consulta somente campanha ativa e possui tratamento de erros", () => {
  assert.deepEqual(publicCampaignWhere("indique-e-ganhe", clientId), {
    slug: "indique-e-ganhe",
    status: "ACTIVE",
    clientId,
  });
  assert.match(growthLoopEmbedScript, /fetch\(endpoint/);
  assert.match(growthLoopEmbedScript, /growthloop:error/);
  assert.match(growthLoopEmbedScript, /config\.buttonIcon/);
  assert.match(growthLoopEmbedScript, /config\.buttonStyle/);
  assert.match(growthLoopEmbedScript, /config\.position/);
  assert.match(growthLoopEmbedScript, /config\.delayMs/);
  assert.match(growthLoopEmbedScript, /config\.initiallyExpanded/);
  assert.match(growthLoopEmbedScript, /window\.setTimeout/);
  assert.match(growthLoopEmbedScript, /\.catch\(/);
  assert.doesNotThrow(() => new Function(growthLoopEmbedScript));
});

test("configuração do embed preserva defaults para campanhas antigas", () => {
  assert.deepEqual(resolveEmbedConfiguration({}, "Quero participar"), {
    embedButtonLabel: "Quero participar",
    embedButtonIcon: "none",
    embedButtonStyle: "solid",
    embedPosition: "bottom-right",
    embedDelayMs: 0,
    embedAnimation: "fade",
    embedInitiallyExpanded: false,
  });
});

test("configuração do embed aceita personalização completa", () => {
  assert.deepEqual(
    resolveEmbedConfiguration({
      embedButtonLabel: "Ganhar presente",
      embedButtonIcon: "gift",
      embedButtonStyle: "gradient",
      embedPosition: "bottom-left",
      embedDelayMs: 2500,
      embedAnimation: "pulse",
      embedInitiallyExpanded: true,
    }),
    {
      embedButtonLabel: "Ganhar presente",
      embedButtonIcon: "gift",
      embedButtonStyle: "gradient",
      embedPosition: "bottom-left",
      embedDelayMs: 2500,
      embedAnimation: "pulse",
      embedInitiallyExpanded: true,
    },
  );
});
