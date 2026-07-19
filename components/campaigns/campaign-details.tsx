"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Gift, Pencil, RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ADMIN_API_ROUTES, APP_ROUTES } from "@/lib/routes";

type CampaignDetailsData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  primaryColor: string;
  initialRewardTitle: string;
  initialRewardValue?: string | null;
  milestoneRewardTitle: string;
  milestoneRewardValue?: string | null;
  qualifiedReferralGoal: number;
  page?: { headline: string; subheadline?: string | null; heroImageUrl?: string | null; thankYouTitle: string } | null;
  rewards: Array<{ id: string; key: string; title: string; description?: string | null; claimUrl?: string | null; active: boolean }>;
  _count: { participants: number; leads: number; referrals: number; invitations: number; leadCampaigns: number; templates: number };
};

const statusLabels: Record<CampaignDetailsData["status"], string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada",
  ARCHIVED: "Arquivada",
};

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Não definida";
}

export function CampaignDetails({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<CampaignDetailsData>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const publicPath = useMemo(() => campaign ? APP_ROUTES.publicCampaign(campaign.slug) : "", [campaign]);

  function load() {
    setLoading(true);
    setError("");
    fetch(ADMIN_API_ROUTES.campaign(id), { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar a campanha.");
        return body as CampaignDetailsData;
      })
      .then(setCampaign)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar a campanha."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function copyPublicLink() {
    await navigator.clipboard.writeText(new URL(publicPath, window.location.origin).toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="panel state-card">Carregando campanha…</div>;
  if (error || !campaign) return <div className="panel state-card error-state"><p>{error || "Campanha não encontrada."}</p><button className="button secondary" onClick={load}><RefreshCw size={16}/> Tentar novamente</button></div>;

  return <>
    <div className="details-heading">
      <div><span className={`status status-${campaign.status.toLowerCase()}`}>{statusLabels[campaign.status]}</span><h1>{campaign.name}</h1><p>{campaign.description || "Sem descrição cadastrada."}</p></div>
      <div className="details-actions">
        <button className="button secondary" onClick={copyPublicLink}>{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? "Copiado" : "Copiar link"}</button>
        <Link className="button secondary" href={publicPath} target="_blank"><ExternalLink size={17}/> Abrir campanha</Link>
        <Link className="button primary" href={APP_ROUTES.campaignEdit(campaign.id)}><Pencil size={17}/> Editar</Link>
      </div>
    </div>

    <section className="metric-grid detail-metrics">
      <article className="metric-card"><Users/><strong>{campaign._count.leads}</strong><p>Leads gerados</p></article>
      <article className="metric-card"><Users/><strong>{campaign._count.participants}</strong><p>Participantes</p></article>
      <article className="metric-card"><ExternalLink/><strong>{campaign._count.referrals}</strong><p>Indicações registradas</p></article>
      <article className="metric-card"><Gift/><strong>{campaign._count.invitations}</strong><p>Convites por e-mail registrados</p></article>
    </section>

    <div className="details-grid">
      <section className="panel details-list"><h2>Informações</h2><dl><div><dt>Slug</dt><dd>{campaign.slug}</dd></div><div><dt>Meta</dt><dd>{campaign.qualifiedReferralGoal} indicações qualificadas</dd></div><div><dt>Criador</dt><dd>Relacionamento não disponível no backend</dd></div><div><dt>Início</dt><dd>{formatDate(campaign.startsAt)}</dd></div><div><dt>Encerramento</dt><dd>{formatDate(campaign.endsAt)}</dd></div><div><dt>Criada em</dt><dd>{formatDate(campaign.createdAt)}</dd></div><div><dt>Atualizada em</dt><dd>{formatDate(campaign.updatedAt)}</dd></div></dl></section>
      <section className="panel details-list"><h2>Página pública</h2><dl><div><dt>Título</dt><dd>{campaign.page?.headline ?? campaign.name}</dd></div><div><dt>Mensagem</dt><dd>{campaign.page?.subheadline ?? "Não configurada"}</dd></div><div><dt>Agradecimento</dt><dd>{campaign.page?.thankYouTitle ?? "Não configurado"}</dd></div><div><dt>Imagem</dt><dd>{campaign.page?.heroImageUrl ? "Configurada" : "Não configurada"}</dd></div></dl></section>
    </div>

    <section className="panel reward-summary"><h2>Recompensas</h2><div>{campaign.rewards.map((reward) => <article key={reward.id}><span className="template-icon"><Gift/></span><div><small>{reward.key}</small><h3>{reward.title}</h3><p>{reward.description || "Sem instruções adicionais."}</p><b>{reward.claimUrl ? "Link configurado" : "Link pendente"}</b></div></article>)}</div></section>
  </>;
}
