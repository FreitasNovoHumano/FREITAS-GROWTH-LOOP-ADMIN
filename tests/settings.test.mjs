import assert from "node:assert/strict";
import test from "node:test";

import {
  brandingSchema,
  integrationSettingsSchema,
  maskSecret,
  notificationSettingsSchema,
  settingsPaths,
  settingsTenantWhere,
} from "../modules/settings/schemas.ts";
import { canAccessAdminApiPath, canAccessClientDashboardPath } from "../lib/client-area.ts";

test("expõe as cinco subpáginas de configurações", () => {
  assert.deepEqual(settingsPaths, [
    "/dashboard/settings/branding",
    "/dashboard/settings/integrations",
    "/dashboard/settings/security",
    "/dashboard/settings/secrets",
    "/dashboard/settings/notifications",
  ]);
});

test("bloqueia usuário cliente nas páginas e APIs administrativas", () => {
  for (const path of settingsPaths) assert.equal(canAccessClientDashboardPath("CLIENT", path), false);
  for (const section of ["branding", "integrations", "security", "secrets", "notifications"]) {
    assert.equal(canAccessAdminApiPath("CLIENT", `/api/admin/settings/${section}`, "GET"), false);
  }
});

test("escopo de settings contém somente o tenant da sessão", () => {
  assert.deepEqual(settingsTenantWhere("tenant-a"), { clientId: "tenant-a" });
  assert.notDeepEqual(settingsTenantWhere("tenant-a"), settingsTenantWhere("tenant-b"));
});

test("segredos são mascarados sem retornar seu conteúdo completo", () => {
  const secret = "re_1234567890_super_secret_abcd";
  const masked = maskSecret(secret);
  assert.equal(masked, "••••••••••••abcd");
  assert.doesNotMatch(masked, /super_secret/);
  assert.equal(maskSecret(""), null);
});

test("identidade exige cores válidas e URLs HTTPS", () => {
  const valid = { brandName: "Freitas", logoUrl: "https://example.com/logo.png", faviconUrl: "", primaryColor: "#7650e8", secondaryColor: "#a989ff", backgroundColor: "#f7f7fb", textColor: "#17151f", buttonStyle: "ROUNDED" };
  assert.equal(brandingSchema.safeParse(valid).success, true);
  assert.equal(brandingSchema.safeParse({ ...valid, logoUrl: "http://example.com/logo.png" }).success, false);
  assert.equal(brandingSchema.safeParse({ ...valid, primaryColor: "purple" }).success, false);
});

test("integrações rejeitam webhook inseguro e notificações desconhecidas", () => {
  const input = { email: { senderName: "Freitas", senderEmail: "growth@example.com", active: true }, whatsapp: { provider: "generic-http", apiUrl: "", instanceId: "", active: false }, webhook: { url: "http://example.com/hook", active: true, events: [] } };
  assert.equal(integrationSettingsSchema.safeParse(input).success, false);
  assert.equal(notificationSettingsSchema.safeParse({ panelEnabled: true, events: ["unknown"] }).success, false);
});
