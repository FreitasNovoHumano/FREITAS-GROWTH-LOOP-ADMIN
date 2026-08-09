import { z } from "zod";

export const CLIENT_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/campaigns",
  "/dashboard/leads",
  "/dashboard/participants",
  "/dashboard/rewards",
] as const;

const CLIENT_DETAIL_ROUTES = [
  /^\/dashboard\/campaigns\/[a-f0-9]{24}$/i,
  /^\/dashboard\/participants\/[a-f0-9]{24}$/i,
] as const;

export const periodSchema = z.enum(["7", "30", "90", "custom"]).default("30");

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  status: z
    .enum([
      "",
      "DRAFT",
      "ACTIVE",
      "PAUSED",
      "ENDED",
      "ARCHIVED",
      "PENDING",
      "BLOCKED",
      "UNSUBSCRIBED",
      "AVAILABLE",
      "CLAIMED",
      "REVOKED",
      "EXPIRED",
    ])
    .default(""),
  campaignId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().regex(/^[a-f0-9]{24}$/i).optional(),
  ),
  dateFrom: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  dateTo: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export function canAccessClientDashboardPath(
  role: string | null | undefined,
  pathname: string,
) {
  if (role === "ADMIN") return true;
  if (role !== "CLIENT") return false;

  return (
    CLIENT_DASHBOARD_ROUTES.some((route) => pathname === route) ||
    CLIENT_DETAIL_ROUTES.some((pattern) => pattern.test(pathname))
  );
}

export function canAccessAdminApiPath(
  role: string | null | undefined,
  pathname: string,
  method: string,
) {
  if (!pathname.startsWith("/api/") || !method) return false;
  return role === "ADMIN";
}

export function calculateConversionRate(completed: number, invitations: number) {
  if (invitations <= 0) return 0;
  return Math.round((completed / invitations) * 10_000) / 100;
}

export function periodStart(days: number, now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "E-mail protegido";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function maskPhone(phone?: string | null) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "Telefone protegido";
  return `${digits.slice(0, 2)} ${digits.slice(2, 3)}****-${digits.slice(-4)}`;
}

export function participantProgress(validReferrals: number, required: number) {
  if (required <= 0) return 100;
  return Math.min(Math.round((validReferrals / required) * 100), 100);
}

export function parseListQuery(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  return listQuerySchema.parse(flat);
}

export function scopeToClient<T extends Record<string, unknown>>(
  clientId: string,
  filters: T,
) {
  return { ...filters, clientId };
}
