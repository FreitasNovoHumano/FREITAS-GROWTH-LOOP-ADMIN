import { z } from "zod";

export const DASHBOARD_PERIOD_VALUES = ["7", "30", "90"] as const;
export const dashboardPeriodSchema = z
  .enum([...DASHBOARD_PERIOD_VALUES, "custom"])
  .catch("30");

export type DashboardPeriodValue = z.infer<typeof dashboardPeriodSchema>;
export type DashboardSearchParams = Record<
  string,
  string | string[] | undefined
>;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DASHBOARD_TIME_ZONE = "America/Sao_Paulo";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateOnlyInDashboardTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function isDateOnly(value: string | undefined) {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && dateOnly(parsed) === value;
}

export function presetDateRange(
  value: (typeof DASHBOARD_PERIOD_VALUES)[number],
  now = new Date(),
) {
  const dateToday = dateOnlyInDashboardTimeZone(now);
  const to = new Date(`${dateToday}T12:00:00.000Z`);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (Number(value) - 1));

  return {
    dateFrom: dateOnly(from),
    dateTo: dateOnly(to),
  };
}

export function resolveDashboardPeriod(
  params: DashboardSearchParams,
  now = new Date(),
) {
  const requestedPeriod = dashboardPeriodSchema.parse(first(params.period));
  const fallback = presetDateRange(
    requestedPeriod === "custom" ? "30" : requestedPeriod,
    now,
  );
  const requestedFrom = first(params.dateFrom);
  const requestedTo = first(params.dateTo);
  const explicit = isDateOnly(requestedFrom) && isDateOnly(requestedTo);
  const dateFrom = isDateOnly(requestedFrom)
    ? requestedFrom!
    : fallback.dateFrom;
  const dateTo = isDateOnly(requestedTo) ? requestedTo! : fallback.dateTo;
  const normalizedFrom = dateFrom <= dateTo ? dateFrom : dateTo;
  const normalizedTo = dateFrom <= dateTo ? dateTo : dateFrom;
  const period =
    requestedPeriod !== "custom" &&
    isDateOnly(requestedFrom) &&
    isDateOnly(requestedTo) &&
    (normalizedFrom !== fallback.dateFrom || normalizedTo !== fallback.dateTo)
      ? "custom"
      : requestedPeriod;
  const label =
    period === "custom"
      ? `${new Date(`${normalizedFrom}T00:00:00.000Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })} a ${new Date(`${normalizedTo}T00:00:00.000Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
      : `últimos ${period} dias`;

  return {
    period,
    explicit,
    dateFrom: normalizedFrom,
    dateTo: normalizedTo,
    label,
    range: {
      gte: new Date(`${normalizedFrom}T00:00:00.000Z`),
      lte: new Date(`${normalizedTo}T23:59:59.999Z`),
    },
    query: new URLSearchParams({
      period,
      dateFrom: normalizedFrom,
      dateTo: normalizedTo,
    }).toString(),
  };
}

export type DashboardPeriod = ReturnType<typeof resolveDashboardPeriod>;

export function withDashboardPeriod(
  href: string,
  selection: Pick<DashboardPeriod, "period" | "dateFrom" | "dateTo">,
) {
  const [path, hash = ""] = href.split("#", 2);
  const [pathname, currentQuery = ""] = path.split("?", 2);
  const params = new URLSearchParams(currentQuery);
  params.set("period", selection.period);
  params.set("dateFrom", selection.dateFrom);
  params.set("dateTo", selection.dateTo);
  const suffix = hash ? `#${hash}` : "";
  return `${pathname}?${params.toString()}${suffix}`;
}
