import assert from "node:assert/strict";
import test from "node:test";

import {
  activeCampaignWhere,
  publicCampaignClientIdSchema,
  publicCampaignWhere,
  serializePublicCampaign,
} from "../lib/public-campaign";

const clientId = "507f1f77bcf86cd799439011";

test("campanha ativa é sempre consultada dentro do tenant", () => {
  assert.deepEqual(activeCampaignWhere(clientId), {
    clientId,
    status: "ACTIVE",
  });
  assert.equal(publicCampaignClientIdSchema.safeParse(clientId).success, true);
  assert.equal(publicCampaignClientIdSchema.safeParse("outro-tenant").success, false);
  assert.deepEqual(publicCampaignWhere("campanha", clientId), {
    slug: "campanha",
    status: "ACTIVE",
    clientId,
  });
});

test("contrato público contém os campos esperados e URL tenant-aware", () => {
  assert.deepEqual(
    serializePublicCampaign(
      {
        id: "campaign-id",
        name: "Indique e Ganhe",
        slug: "indique-e-ganhe",
        description: "Campanha pública",
        logoUrl: "https://cdn.example.com/logo.png",
        status: "ACTIVE",
        clientId,
        page: { heroImageUrl: "https://cdn.example.com/hero.png" },
      },
      "https://loop.example.com/api/public/campaigns/active",
    ),
    {
      id: "campaign-id",
      name: "Indique e Ganhe",
      slug: "indique-e-ganhe",
      description: "Campanha pública",
      image: "https://cdn.example.com/hero.png",
      status: "ACTIVE",
      publicUrl: `https://loop.example.com/growth-loop/indique-e-ganhe?clientId=${clientId}`,
    },
  );
});
