import assert from "node:assert/strict";
import test from "node:test";

import {
  presetDateRange,
  resolveDashboardPeriod,
  withDashboardPeriod,
} from "../lib/dashboard-period";

const now = new Date("2026-08-13T12:00:00.000Z");

test("atalhos de período usam hoje e incluem o dia atual", () => {
  assert.deepEqual(presetDateRange("7", now), {
    dateFrom: "2026-08-07",
    dateTo: "2026-08-13",
  });
  assert.deepEqual(presetDateRange("30", now), {
    dateFrom: "2026-07-15",
    dateTo: "2026-08-13",
  });
  assert.deepEqual(presetDateRange("90", now), {
    dateFrom: "2026-05-16",
    dateTo: "2026-08-13",
  });
});

test("hoje respeita o fuso do produto perto da virada em UTC", () => {
  assert.deepEqual(
    presetDateRange("7", new Date("2026-08-14T01:30:00.000Z")),
    { dateFrom: "2026-08-07", dateTo: "2026-08-13" },
  );
});

test("período personalizado normaliza datas e cobre o dia final", () => {
  const period = resolveDashboardPeriod(
    {
      period: "custom",
      dateFrom: "2026-08-10",
      dateTo: "2026-08-05",
    },
    now,
  );

  assert.equal(period.dateFrom, "2026-08-05");
  assert.equal(period.dateTo, "2026-08-10");
  assert.equal(period.range.gte.toISOString(), "2026-08-05T00:00:00.000Z");
  assert.equal(period.range.lte.toISOString(), "2026-08-10T23:59:59.999Z");
  assert.equal(period.label, "05/08/2026 a 10/08/2026");
});

test("links preservam filtros existentes e recebem o período global", () => {
  const period = resolveDashboardPeriod({ period: "30" }, now);
  assert.equal(
    withDashboardPeriod("/dashboard/campaigns?status=ACTIVE", period),
    "/dashboard/campaigns?status=ACTIVE&period=30&dateFrom=2026-07-15&dateTo=2026-08-13",
  );
  assert.equal(
    withDashboardPeriod("/dashboard/reports#funil", period),
    "/dashboard/reports?period=30&dateFrom=2026-07-15&dateTo=2026-08-13#funil",
  );
});
