import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateConversionRate,
  canAccessAdminApiPath,
  canAccessClientDashboardPath,
  CLIENT_DASHBOARD_ROUTES,
  listQuerySchema,
  maskEmail,
  maskPhone,
  participantProgress,
  periodStart,
  scopeToClient,
} from "../lib/client-area";

test("cliente acessa somente as cinco áreas permitidas", () => {
  assert.deepEqual(CLIENT_DASHBOARD_ROUTES, [
    "/dashboard",
    "/dashboard/campaigns",
    "/dashboard/leads",
    "/dashboard/participants",
    "/dashboard/rewards",
  ]);

  for (const path of [
    "/dashboard",
    "/dashboard/campaigns",
    "/dashboard/campaigns/507f1f77bcf86cd799439011",
    "/dashboard/leads",
    "/dashboard/participants",
    "/dashboard/participants/507f1f77bcf86cd799439011",
    "/dashboard/rewards",
  ]) {
    assert.equal(canAccessClientDashboardPath("CLIENT", path), true);
  }

  for (const path of [
    "/dashboard/campaigns/new",
    "/dashboard/emails",
    "/dashboard/fraud",
    "/dashboard/settings",
    "/dashboard/reports",
    "/dashboard/campaigns/import",
    "/dashboard/participants/export",
  ]) {
    assert.equal(canAccessClientDashboardPath("CLIENT", path), false);
  }

  assert.equal(
    canAccessClientDashboardPath("CLIENT", "/dashboard/emails"),
    false,
  );
});

test("backend bloqueia todas as rotas administrativas para o cliente", () => {
  for (const [method, path] of [
    ["GET", "/api/admin/campaigns"],
    ["GET", "/api/admin/data/leads"],
    ["GET", "/api/admin/data/participants"],
    ["GET", "/api/admin/data/rewards"],
    ["POST", "/api/admin/campaigns"],
    ["PATCH", "/api/admin/campaigns/507f1f77bcf86cd799439011"],
    ["GET", "/api/admin/data/fraud"],
    ["GET", "/api/admin/settings"],
    ["GET", "/api/admin/export/leads"],
    ["GET", "/api/v1"],
    ["POST", "/api/v1"],
  ]) {
    assert.equal(canAccessAdminApiPath("CLIENT", path, method), false);
  }
});

test("administrador mantém acesso integral", () => {
  assert.equal(
    canAccessClientDashboardPath("ADMIN", "/dashboard/settings"),
    true,
  );
  assert.equal(
    canAccessClientDashboardPath("ADMIN", "/dashboard/campaigns/new"),
    true,
  );
  assert.equal(
    canAccessAdminApiPath("ADMIN", "/api/admin/campaigns/qualquer-id", "PATCH"),
    true,
  );
  assert.equal(canAccessAdminApiPath("ADMIN", "/api/v1", "GET"), true);
});

test("escopo da sessão prevalece sobre clientId informado externamente", () => {
  assert.deepEqual(
    scopeToClient("client-from-session", {
      clientId: "client-from-request",
      status: "ACTIVE",
    }),
    { clientId: "client-from-session", status: "ACTIVE" },
  );
});

test("taxa de conversão trata divisão por zero e arredondamento", () => {
  assert.equal(calculateConversionRate(10, 0), 0);
  assert.equal(calculateConversionRate(1, 3), 33.33);
  assert.equal(calculateConversionRate(3, 4), 75);
});

test("período aplica a quantidade correta de dias", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");
  assert.equal(
    periodStart(30, now).toISOString(),
    "2026-06-25T12:00:00.000Z",
  );
});

test("paginação rejeita consultas excessivas", () => {
  assert.throws(() => listQuerySchema.parse({ pageSize: 101 }));
  assert.equal(listQuerySchema.parse({ pageSize: 10 }).pageSize, 10);
});

test("dados pessoais são minimizados e progresso não supera 100%", () => {
  assert.equal(maskEmail("fabio@email.com"), "fa***@email.com");
  assert.equal(maskPhone("(31) 99999-1234"), "31 9****-1234");
  assert.equal(participantProgress(5, 3), 100);
  assert.equal(participantProgress(2, 3), 67);
});
