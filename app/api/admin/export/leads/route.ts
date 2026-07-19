import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/authorization";
const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET() {
  const { clientId, userId } = await requireTenant();
  const leads = await prisma.lead.findMany({ where: { clientId }, include: { campaign: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  await prisma.auditLog.create({ data: { clientId, actorId: userId, actorType: "USER", action: "LEADS_EXPORTED", entityType: "Lead", entityId: "bulk", metadata: { count: leads.length } } });
  const body = ["Nome,Email,Telefone,Campanha,Origem,Criado em", ...leads.map(l => [l.name, l.email, l.phone, l.campaign.name, l.source, l.createdAt.toISOString()].map(csv).join(","))].join("\n");
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="growth-loop-leads.csv"`, "cache-control": "no-store" } });
}
