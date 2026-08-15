import Link from "next/link";
import {
  BarChart3,
  Gift,
  MousePointerClick,
  Target,
  UserCheck,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getClientOverview } from "@/lib/client-data";
import {
  resolveDashboardPeriod,
  withDashboardPeriod,
  type DashboardSearchParams,
} from "@/lib/dashboard-period";
import { requireTenant } from "@/lib/authorization";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const { clientId, clientName, isAdmin } = await requireTenant();
  const selection = resolveDashboardPeriod(await searchParams);
  const data = await getClientOverview(clientId, selection.range);
  const metrics = [
    ["Campanhas ativas", data.metrics.activeCampaigns, Target, "/dashboard/campaigns?status=ACTIVE"],
    ["Participantes", data.metrics.participants, Users, "/dashboard/participants"],
    ["Indicações realizadas", data.metrics.referrals, MousePointerClick, "/dashboard/reports#funil"],
    ["Leads gerados", data.metrics.leads, UserRoundPlus, "/dashboard/leads"],
    ["Recompensas liberadas", data.metrics.releasedRewards, Gift, "/dashboard/rewards"],
    ["Taxa de conversão", `${data.metrics.conversionRate}%`, BarChart3, "/dashboard/reports#funil"],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "PAINEL ADMINISTRATIVO" : "DASHBOARD DO CLIENTE"}
        title={isAdmin ? "Visão geral do Growth Loop" : "Resultados da sua empresa"}
        description={
          isAdmin
            ? `Cliente: ${clientName} · acompanhe a operação do tenant selecionado.`
            : "Métricas e atividades filtradas exclusivamente para a sua empresa."
        }
      />

      <PeriodFilter selection={selection} />

      <section className="metric-grid metric-grid-six">
        {metrics.map(([label, value, Icon, href]) => (
          <Link
            aria-label={`${label}: ${value}. Ver ${label.toLowerCase()} em ${selection.label}.`}
            className="metric-card metric-card-link"
            href={withDashboardPeriod(href, selection)}
            key={label}
          >
            <div>
              <span className="metric-icon">
                <Icon aria-hidden="true" />
              </span>
            </div>
            <strong>{value}</strong>
            <p>{label}</p>
          </Link>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Campanhas recentes</h2>
            <p>Últimas campanhas atualizadas pela sua empresa</p>
          </div>
          <Link href={withDashboardPeriod("/dashboard/campaigns", selection)}>
            Ver todas
          </Link>
        </div>
        {data.recentCampaigns.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma campanha disponível"
            description="As campanhas criadas para sua empresa aparecerão aqui."
          />
        ) : (
          data.recentCampaigns.map((campaign) => (
            <div className="campaign-row" key={campaign.id}>
              <span className="campaign-symbol purple">
                {campaign.name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{campaign.name}</strong>
                <small>
                  {campaign._count.participants} participantes ·{" "}
                  {campaign._count.leads} leads
                </small>
              </span>
              <span>
                <strong>{campaign.conversionRate}%</strong>
                <small>conversão</small>
              </span>
              <span>
                <strong>{campaign._count.referrals}</strong>
                <small>indicações</small>
              </span>
              <Link
                href={withDashboardPeriod(
                  `/dashboard/campaigns/${campaign.id}`,
                  selection,
                )}
              >
                Ver campanha
              </Link>
              <StatusBadge status={campaign.status} />
            </div>
          ))
        )}
      </section>

      <section className="dashboard-grid overview-lists">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Atividades recentes</h2>
              <p>Eventos registrados no período selecionado</p>
            </div>
          </div>
          {data.recentEvents.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Nenhuma atividade recente"
              description="Novos eventos das campanhas aparecerão aqui."
            />
          ) : (
            <ul className="activity-list">
              {data.recentEvents.map((event) => (
                <li key={event.id}>
                  <span className="metric-icon">
                    <UserCheck aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{event.eventType}</strong>
                    <small>
                      {event.aggregateType} ·{" "}
                      {event.createdAt.toLocaleString("pt-BR")}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Pendências</h2>
              <p>Itens que podem exigir acompanhamento</p>
            </div>
          </div>
          <ul className="pending-list">
            <li>
              <Gift aria-hidden="true" />
              <span>
                <strong>{data.pending.rewardsAwaitingDelivery}</strong>
                <small>recompensas liberadas aguardando tratamento</small>
              </span>
            </li>
            <li>
              <Target aria-hidden="true" />
              <span>
                <strong>{data.pending.campaignsEndingSoon}</strong>
                <small>campanhas encerrando nos próximos 7 dias</small>
              </span>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}
