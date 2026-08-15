import { Download, UserRoundPlus } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ListFilters } from "@/components/dashboard/list-filters";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { maskEmail, maskPhone, parseListQuery } from "@/lib/client-area";
import { getClientLeads } from "@/lib/client-data";
import { resolveDashboardPeriod } from "@/lib/dashboard-period";
import { requireTenant } from "@/lib/authorization";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const selection = resolveDashboardPeriod(params);
  const { clientId, clientName, isAdmin } = await requireTenant();
  const { items, total } = await getClientLeads(clientId, query);
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) exportParams.set(key, normalized);
  }

  return (
    <>
      <PageHeader
        eyebrow="RELACIONAMENTO"
        title={`Leads${selection.explicit ? `, ${selection.label}` : ""}`}
        description={
          isAdmin
            ? `Cliente: ${clientName} · contatos gerados pelas campanhas deste tenant.`
            : "Contatos gerados pelas campanhas da sua empresa, com dados minimizados."
        }
        action={isAdmin ? (
          <a
            className="button secondary"
            href={`/api/admin/export/leads?${exportParams.toString()}`}
          >
            <Download size={17} aria-hidden="true" />
            Exportar CSV
          </a>
        ) : undefined}
      />
      <ListFilters
        search={query.search}
        period={selection.explicit ? selection.period : undefined}
        dateFrom={selection.explicit ? selection.dateFrom : undefined}
        dateTo={selection.explicit ? selection.dateTo : undefined}
      />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                {isAdmin && <th>Cliente</th>}
                <th>Contato protegido</th>
                <th>Campanha</th>
                <th>Origem</th>
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  {isAdmin && <td>{clientName}</td>}
                  <td>
                    {maskEmail(lead.email)}
                    <br />
                    <small>{maskPhone(lead.phone)}</small>
                  </td>
                  <td>{lead.campaign.name}</td>
                  <td>{lead.source}</td>
                  <td>{lead.createdAt.toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <EmptyState
              icon={UserRoundPlus}
              title="Nenhum lead encontrado"
              description="Quando uma indicação gerar um novo contato, ele aparecerá nesta área."
            />
          )}
        </div>
      </section>
      <Pagination
        page={query.page}
        pageSize={query.pageSize}
        total={total}
        searchParams={params}
      />
    </>
  );
}
