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
import { StatusBadge } from "@/components/dashboard/status-badge";
import { periodSchema, periodStart } from "@/lib/client-area";
import { getClientOverview } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { clientId, isAdmin } = await requireTenant();
  const { period, dateFrom, dateTo } = await searchParams;
  const selectedPeriod = periodSchema.catch("30").parse(period);
  const customFrom =
    selectedPeriod === "custom" && dateFrom
      ? new Date(`${dateFrom}T00:00:00.000Z`)
      : null;
  const since =
    customFrom && !Number.isNaN(customFrom.getTime())
      ? customFrom
      : periodStart(Number(selectedPeriod === "custom" ? "30" : selectedPeriod));
  const customTo =
    selectedPeriod === "custom" && dateTo
      ? new Date(`${dateTo}T23:59:59.999Z`)
      : null;
  const data = await getClientOverview(clientId, {
    gte: since,
    ...(customTo && !Number.isNaN(customTo.getTime())
      ? { lte: customTo }
      : {}),
  });
  const metrics = [
    ["Campanhas ativas", data.metrics.activeCampaigns, Target],
    ["Participantes", data.metrics.participants, Users],
    ["Indicações realizadas", data.metrics.referrals, MousePointerClick],
    ["Leads gerados", data.metrics.leads, UserRoundPlus],
    ["Recompensas liberadas", data.metrics.releasedRewards, Gift],
    ["Taxa de conversão", `${data.metrics.conversionRate}%`, BarChart3],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "PAINEL ADMINISTRATIVO" : "DASHBOARD DO CLIENTE"}
        title={isAdmin ? "Visão geral do Growth Loop" : "Resultados da sua empresa"}
        description={
          isAdmin
            ? "Acompanhe a operação do tenant selecionado."
            : "Métricas e atividades filtradas exclusivamente para a sua empresa."
        }
      />

      <nav className="period-filter" aria-label="Período das métricas">
        {(["7", "30", "90"] as const).map((value) => (
          <Link
            className={selectedPeriod === value ? "active" : ""}
            href={`?period=${value}`}
            key={value}
          >
            Últimos {value} dias
          </Link>
        ))}
        <form method="get" className="custom-period">
          <input type="hidden" name="period" value="custom" />
          <label>
            <span>De</span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              required
            />
          </label>
          <label>
            <span>Até</span>
            <input type="date" name="dateTo" defaultValue={dateTo} required />
          </label>
          <button className="button secondary" type="submit">
            Período personalizado
          </button>
        </form>
      </nav>

      <section className="metric-grid metric-grid-six">
        {metrics.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <div>
              <span className="metric-icon">
                <Icon aria-hidden="true" />
              </span>
            </div>
            <strong>{value}</strong>
            <p>{label}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Campanhas recentes</h2>
            <p>Últimas campanhas atualizadas pela sua empresa</p>
          </div>
          <Link href="/dashboard/campaigns">Ver todas</Link>
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
              <Link href={`/dashboard/campaigns/${campaign.id}`}>
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
