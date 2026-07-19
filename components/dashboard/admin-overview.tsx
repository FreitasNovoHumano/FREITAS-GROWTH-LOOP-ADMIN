"use client";

import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  CirclePause,
  FileDown,
  Gift,
  Layers3,
  RefreshCw,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";

type Overview = {
  campaigns: {
    total: number;
    byStatus: Record<CampaignStatus, number>;
  };
  leads: number;
  participants: number;
  qualifiedReferrals: number;
  firstRewardClaimed: number;
  secondRewardSent: number;
  recentCampaigns: Array<{
    id: string;
    name: string;
    slug: string;
    status: CampaignStatus;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { leads: number; participants: number; referrals: number };
  }>;
};

const statusLabels: Record<CampaignStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada",
  ARCHIVED: "Arquivada",
};

function useOverview() {
  const [overview, setOverview] = useState<Overview>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overview", {
        headers: { accept: "application/json" },
        signal,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "Não foi possível carregar os indicadores.",
        );
      }
      setOverview(body as Overview);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os indicadores.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { overview, loading, error, retry: () => void load() };
}

function OverviewState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <section className="panel table-empty" aria-live="polite">Carregando dados reais do painel…</section>;
  return (
    <section className="panel table-empty" role="alert">
      <h2>Não foi possível carregar o painel</h2>
      <p>{error}</p>
      <button className="button secondary" type="button" onClick={retry}>
        <RefreshCw size={16} /> Tentar novamente
      </button>
    </section>
  );
}

function Metrics({ overview, reports = false }: { overview: Overview; reports?: boolean }) {
  const metrics = reports
    ? [
        ["Leads capturados", overview.leads, UserRoundPlus],
        ["Primeiras recompensas acessadas", overview.firstRewardClaimed, CheckCircle2],
        ["Indicações qualificadas", overview.qualifiedReferrals, Users],
        ["Segundas recompensas enviadas", overview.secondRewardSent, Gift],
      ] as const
    : [
        ["Leads capturados", overview.leads, UserRoundPlus],
        ["Participantes", overview.participants, Users],
        ["Indicações qualificadas", overview.qualifiedReferrals, CheckCircle2],
        ["Recompensas adicionais enviadas", overview.secondRewardSent, Gift],
      ] as const;

  return (
    <section className="metric-grid" aria-label="Indicadores consolidados">
      {metrics.map(([label, value, Icon]) => (
        <article className="metric-card" key={label}>
          <div><span className="metric-icon"><Icon /></span></div>
          <strong>{value.toLocaleString("pt-BR")}</strong>
          <p>{label}</p>
        </article>
      ))}
    </section>
  );
}

export function DashboardOverview() {
  const { overview, loading, error, retry } = useOverview();
  if (loading || error || !overview) return <OverviewState loading={loading} error={error} retry={retry} />;

  const status = overview.campaigns.byStatus;
  return (
    <>
      <Metrics overview={overview} />
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head">
            <div><h2>Campanhas por status</h2><p>Distribuição atual, sem estimativas</p></div>
          </div>
          <div className="campaign-stats">
            <span><Layers3 /><strong>{overview.campaigns.total}</strong><small>Total</small></span>
            <span><CheckCircle2 /><strong>{status.ACTIVE}</strong><small>Ativas</small></span>
            <span><CirclePause /><strong>{status.PAUSED}</strong><small>Pausadas</small></span>
            <span><Archive /><strong>{status.DRAFT + status.ENDED + status.ARCHIVED}</strong><small>Outros estados</small></span>
          </div>
        </article>
        <article className="panel loop-card">
          <span className="orbit-large"><span>{overview.firstRewardClaimed}</span><small>acessos</small></span>
          <h2>Primeiras recompensas acessadas</h2>
          <p>Total confirmado pelo backend em todas as campanhas.</p>
          <Link href="/dashboard/rewards">Ver recompensas</Link>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><h2>Campanhas recentes</h2><p>As cinco campanhas atualizadas mais recentemente pelo backend</p></div>
          <Link href="/dashboard/campaigns">Ver todas</Link>
        </div>
        {overview.recentCampaigns.length === 0 ? (
          <div className="table-empty">Nenhuma campanha criada ainda.</div>
        ) : overview.recentCampaigns.map((campaign) => (
          <div className="campaign-row" key={campaign.id}>
            <span className="campaign-symbol purple">{campaign.name.slice(0, 2).toUpperCase()}</span>
            <span><strong>{campaign.name}</strong><small>{campaign._count.participants} participantes</small></span>
            <span><strong>{campaign._count.leads}</strong><small>leads</small></span>
            <span><strong>{campaign._count.referrals}</strong><small>indicações</small></span>
            <span className={`status ${campaign.status === "ACTIVE" ? "active" : ""}`}>{statusLabels[campaign.status]}</span>
          </div>
        ))}
      </section>
    </>
  );
}

export function ReportsOverview() {
  const { overview, loading, error, retry } = useOverview();
  if (loading || error || !overview) return <OverviewState loading={loading} error={error} retry={retry} />;

  return (
    <>
      <Metrics overview={overview} reports />
      <section className="insight-grid">
        <article className="panel">
          <span className="eyebrow">DADOS DISPONÍVEIS</span>
          <h2>Resumo operacional</h2>
          <p>{overview.participants.toLocaleString("pt-BR")} participantes cadastrados em {overview.campaigns.total.toLocaleString("pt-BR")} campanhas.</p>
          <p>{overview.firstRewardClaimed.toLocaleString("pt-BR")} primeiras recompensas foram acessadas e {overview.secondRewardSent.toLocaleString("pt-BR")} recompensas adicionais foram enviadas.</p>
        </article>
        <article className="panel">
          <span className="eyebrow">EXPORTAÇÃO</span>
          <h2>Dados de leads</h2>
          <p>O arquivo CSV utiliza a exportação real disponível no backend e respeita o acesso administrativo.</p>
          <Link className="button secondary" href="/api/admin/export/leads">
            <FileDown size={16} /> Exportar leads em CSV
          </Link>
        </article>
      </section>
      <section className="panel">
        <div className="panel-head"><div><h2>Análises ainda indisponíveis</h2><p>Estes recursos dependem de dados ou endpoints que o backend ainda não fornece.</p></div></div>
        <div className="settings-list">
          <div className="setting-row panel"><span><Layers3 /></span><span><strong>Séries históricas e gráficos por período</strong><small>Indisponível: o overview atual retorna apenas totais consolidados.</small></span></div>
          <div className="setting-row panel"><span><FileDown /></span><span><strong>Exportação em PDF</strong><small>Indisponível: não há endpoint de geração de PDF.</small></span></div>
          <div className="setting-row panel"><span><RefreshCw /></span><span><strong>Análises e automações recomendadas</strong><small>Indisponível: não há serviço de automação ou dados suficientes para gerar recomendações verificáveis.</small></span></div>
        </div>
      </section>
    </>
  );
}
