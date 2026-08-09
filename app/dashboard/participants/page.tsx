import Link from "next/link";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ListFilters } from "@/components/dashboard/list-filters";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  maskEmail,
  parseListQuery,
  participantProgress,
} from "@/lib/client-area";
import { getClientParticipants } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

const statuses = [
  { value: "PENDING", label: "Pendente" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "BLOCKED", label: "Bloqueado" },
  { value: "UNSUBSCRIBED", label: "Descadastrado" },
] as const;

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const { clientId } = await requireTenant();
  const { items, total } = await getClientParticipants(clientId, query);

  return (
    <>
      <PageHeader
        eyebrow="COMUNIDADE"
        title="Participantes"
        description="Progresso real dos participantes vinculados às suas campanhas."
      />
      <ListFilters
        search={query.search}
        status={query.status}
        statuses={statuses}
      />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Participante</th>
                <th>Campanha</th>
                <th>Indicações</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {items.map((participant) => {
                const goal = participant.campaign.qualifiedReferralGoal;
                const progress = participantProgress(
                  participant.qualifiedReferralCount,
                  goal,
                );
                return (
                  <tr key={participant.id}>
                    <td>
                      <Link
                        className="table-link"
                        href={`/dashboard/participants/${participant.id}`}
                      >
                        {participant.name}
                      </Link>
                      <br />
                      <small>{maskEmail(participant.email)}</small>
                    </td>
                    <td>{participant.campaign.name}</td>
                    <td>
                      {participant.qualifiedReferralCount} qualificadas de{" "}
                      {participant._count.referrals} registradas
                    </td>
                    <td>
                      <div className="progress">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <small>
                        {participant.qualifiedReferralCount} de {goal} ·{" "}
                        {progress}%
                      </small>
                    </td>
                    <td>
                      <StatusBadge status={participant.status} />
                    </td>
                    <td>
                      {participant.createdAt.toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <EmptyState
              icon={Users}
              title="Nenhum participante cadastrado"
              description="Os participantes das suas campanhas aparecerão aqui."
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
