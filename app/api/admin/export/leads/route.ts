import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { parseListQuery } from "@/lib/client-area";
import { prisma } from "@/lib/prisma";

const csv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  try {
    const { clientId, userId } = await requireAdminTenant();
    const query = parseListQuery(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const createdAt =
      query.dateFrom || query.dateTo
        ? {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          }
        : undefined;
    const where = {
      clientId,
      ...(query.campaignId ? { campaignId: query.campaignId } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                phone: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    const leads = await prisma.lead.findMany({
      where,
      include: { campaign: { select: { name: true } } },
      orderBy: { createdAt: query.sortOrder },
      take: 10_000,
    });

    await prisma.auditLog.create({
      data: {
        clientId,
        actorId: userId,
        actorType: "USER",
        action: "LEADS_EXPORTED",
        entityType: "Lead",
        entityId: "bulk",
        metadata: {
          count: leads.length,
          search: query.search || null,
          campaignId: query.campaignId || null,
          dateFrom: query.dateFrom?.toISOString() || null,
          dateTo: query.dateTo?.toISOString() || null,
        },
      },
    });

    const body = [
      "Nome,Email,Telefone,Campanha,Origem,Criado em",
      ...leads.map((lead) =>
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.campaign.name,
          lead.source,
          lead.createdAt.toISOString(),
        ]
          .map(csv)
          .join(","),
      ),
    ].join("\n");

    return new Response(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="growth-loop-leads.csv"',
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof AuthorizationError
            ? error.message
            : "Não foi possível exportar os leads",
      },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
