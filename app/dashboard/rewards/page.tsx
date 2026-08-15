import { Gift } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ListFilters } from "@/components/dashboard/list-filters";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { maskEmail, parseListQuery } from "@/lib/client-area";
import { getClientRewards } from "@/lib/client-data";
import { resolveDashboardPeriod } from "@/lib/dashboard-period";
import { requireTenant } from "@/lib/authorization";

const statuses = [
  { value: "PENDING", label: "Pendente" },
  { value: "AVAILABLE", label: "Liberada" },
  { value: "CLAIMED", label: "Resgatada" },
  { value: "REVOKED", label: "Revogada" },
  { value: "EXPIRED", label: "Expirada" },
] as const;

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const selection = resolveDashboardPeriod(params);
  const { clientId, clientName, isAdmin } = await requireTenant();
  const { items, total } = await getClientRewards(clientId, query);

  return (
    <>
      <PageHeader
        eyebrow="INCENTIVOS"
        title={`Recompensas${selection.explicit ? `, ${selection.label}` : ""}`}
        description={
          isAdmin
            ? `Cliente: ${clientName} · liberações e resgates deste tenant.`
            : "Liberações e resgates vinculados exclusivamente à sua empresa."
        }
      />
      <ListFilters
        search={query.search}
        status={query.status}
        statuses={statuses}
        period={selection.explicit ? selection.period : undefined}
        dateFrom={selection.explicit ? selection.dateFrom : undefined}
        dateTo={selection.explicit ? selection.dateTo : undefined}
      />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Recompensa</th>
                {isAdmin && <th>Cliente</th>}
                <th>Campanha</th>
                <th>Participante</th>
                <th>Regra</th>
                <th>Status</th>
                <th>Liberação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((grant) => (
                <tr key={grant.id}>
                  <td>{grant.reward.title}</td>
                  {isAdmin && <td>{clientName}</td>}
                  <td>{grant.reward.campaign.name}</td>
                  <td>
                    {grant.participant.name}
                    <br />
                    <small>{maskEmail(grant.participant.email)}</small>
                  </td>
                  <td>{grant.milestone}</td>
                  <td>
                    <StatusBadge status={grant.status} />
                  </td>
                  <td>{grant.grantedAt.toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <EmptyState
              icon={Gift}
              title="Nenhuma recompensa disponível"
              description="As recompensas liberadas ou pendentes aparecerão nesta área."
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
