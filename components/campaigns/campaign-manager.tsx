"use client";

import Link from "next/link";
import {
  ArrowDownAZ,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  FilePenLine,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_API_ROUTES, APP_ROUTES } from "@/lib/routes";

type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  qualifiedReferralGoal: number;
  _count: { participants: number; leads: number; referrals: number };
};

type SortOption = "updated-desc" | "created-desc" | "name-asc" | "leads-desc";
type DisplayStatus = CampaignStatus | "SCHEDULED" | "EXPIRED";

const statusLabels: Record<DisplayStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada",
  ARCHIVED: "Arquivada",
  SCHEDULED: "Agendada",
  EXPIRED: "Expirada",
};

function displayStatus(campaign: Campaign): DisplayStatus {
  const now = Date.now();
  if (campaign.status === "ACTIVE" && campaign.startsAt && new Date(campaign.startsAt).getTime() > now) {
    return "SCHEDULED";
  }
  if (campaign.status === "ACTIVE" && campaign.endsAt && new Date(campaign.endsAt).getTime() < now) {
    return "EXPIRED";
  }
  return campaign.status;
}

function formatDate(value?: string | null) {
  if (!value) return "Não definida";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data inválida" : date.toLocaleDateString("pt-BR");
}

function campaignPath(id: string) {
  return APP_ROUTES.campaignDetails(id);
}

function publicCampaignPath(slug: string) {
  return APP_ROUTES.publicCampaign(slug);
}

export function CampaignManager() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | DisplayStatus>("ALL");
  const [sort, setSort] = useState<SortOption>("updated-desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(ADMIN_API_ROUTES.campaigns, { signal, cache: "no-store" });
      const value: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = value && typeof value === "object" && "error" in value
          ? String(value.error)
          : "Não foi possível carregar as campanhas.";
        throw new Error(message);
      }
      if (!Array.isArray(value)) throw new Error("A resposta das campanhas é inválida.");
      setItems(value as Campaign[]);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as campanhas.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return items
      .filter((campaign) => {
        const matchesQuery = !normalizedQuery
          || campaign.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
          || campaign.slug.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
        return matchesQuery && (status === "ALL" || displayStatus(campaign) === status);
      })
      .sort((first, second) => {
        if (sort === "name-asc") return first.name.localeCompare(second.name, "pt-BR");
        if (sort === "leads-desc") return second._count.leads - first._count.leads;
        const key = sort === "created-desc" ? "createdAt" : "updatedAt";
        return new Date(second[key]).getTime() - new Date(first[key]).getTime();
      });
  }, [items, query, sort, status]);

  async function copyPublicLink(campaign: Campaign) {
    try {
      const url = new URL(publicCampaignPath(campaign.slug), window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopiedId(campaign.id);
      window.setTimeout(() => setCopiedId((current) => current === campaign.id ? null : current), 2_500);
    } catch {
      setError("Não foi possível copiar o link. Abra a campanha e copie a URL do navegador.");
    }
  }

  async function updateStatus() {
    if (!selected) return;
    const nextStatus: CampaignStatus = selected.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setUpdating(true);
    setActionError("");
    try {
      const response = await fetch(ADMIN_API_ROUTES.campaign(selected.id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "Não foi possível alterar o status da campanha.";
        throw new Error(message);
      }
      setItems((current) => current.map((campaign) => (
        campaign.id === selected.id ? { ...campaign, status: nextStatus, updatedAt: new Date().toISOString() } : campaign
      )));
      setSelected(null);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : "Não foi possível alterar o status da campanha.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div className="campaign-toolbar" aria-label="Filtros de campanhas">
        <label className="search campaign-search">
          <span className="sr-only">Buscar campanhas</span>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou slug..."
          />
        </label>
        <label className="campaign-filter">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="ALL">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
        <label className="campaign-filter">
          <span><ArrowDownAZ size={15} aria-hidden="true" /> Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            <option value="updated-desc">Atualizadas recentemente</option>
            <option value="created-desc">Criadas recentemente</option>
            <option value="name-asc">Nome: A–Z</option>
            <option value="leads-desc">Mais leads</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="campaign-feedback error-state" role="alert">
          <div><strong>Não foi possível exibir as campanhas.</strong><p>{error}</p></div>
          <button className="button secondary" type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      )}

      <section className="campaign-grid" aria-busy={loading} aria-live="polite">
        {loading && Array.from({ length: 3 }, (_, index) => (
          <div className="campaign-card campaign-skeleton" key={index} aria-hidden="true">
            <span /><span /><span /><span />
          </div>
        ))}

        {!loading && !error && filtered.map((campaign) => {
          const shownStatus = displayStatus(campaign);
          const isActive = campaign.status === "ACTIVE";
          const detailPath = campaignPath(campaign.id);
          return (
            <article className="campaign-card" key={campaign.id}>
              <div className="campaign-cover">
                <span className={`status status-${shownStatus.toLowerCase()}`}>{statusLabels[shownStatus]}</span>
                <strong aria-hidden="true">{campaign.name.slice(0, 2).toUpperCase()}</strong>
              </div>
              <div className="campaign-content">
                <h2><Link href={detailPath}>{campaign.name}</Link></h2>
                <code className="campaign-slug">/c/{campaign.slug}</code>
                <p>{campaign.description || "Sem descrição cadastrada."}</p>
                <div className="campaign-stats">
                  <span><Users aria-hidden="true" /> <strong>{campaign._count.leads}</strong><small>Leads</small></span>
                  <span><ExternalLink aria-hidden="true" /> <strong>{campaign._count.referrals}</strong><small>Indicações</small></span>
                  <span><CalendarDays aria-hidden="true" /> <strong>{formatDate(campaign.endsAt)}</strong><small>Disponível até</small></span>
                </div>
                <div className="campaign-card-meta">
                  <span>Criada em {formatDate(campaign.createdAt)}</span>
                  <span>Atualizada em {formatDate(campaign.updatedAt)}</span>
                </div>
                <div className="card-actions campaign-actions">
                  <Link href={detailPath} title={`Ver detalhes de ${campaign.name}`}>Ver detalhes</Link>
                  <Link href={APP_ROUTES.campaignEdit(campaign.id)} title={`Editar ${campaign.name}`}><FilePenLine size={15} aria-hidden="true" /> Editar</Link>
                  <a href={publicCampaignPath(campaign.slug)} target="_blank" rel="noreferrer" title={`Abrir página pública de ${campaign.name}`}>
                    <ExternalLink size={15} aria-hidden="true" /> Abrir página
                  </a>
                  <button type="button" onClick={() => void copyPublicLink(campaign)} title={`Copiar link público de ${campaign.name}`}>
                    {copiedId === campaign.id ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    {copiedId === campaign.id ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    className={isActive ? "danger-text" : "success-text"}
                    type="button"
                    onClick={() => { setActionError(""); setSelected(campaign); }}
                    title={`${isActive ? "Pausar" : "Ativar"} ${campaign.name}`}
                  >
                    {isActive ? "Pausar" : "Ativar"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!loading && !error && !filtered.length && (
          <div className="empty">
            <Plus aria-hidden="true" />
            <h3>{items.length ? "Nenhuma campanha encontrada" : "Nenhuma campanha criada ainda"}</h3>
            <p>{items.length
              ? "Ajuste a busca ou os filtros para encontrar outra campanha."
              : "Crie sua primeira campanha para começar a gerar indicações e leads."}</p>
            {items.length
              ? <button className="button secondary" type="button" onClick={() => { setQuery(""); setStatus("ALL"); }}>Limpar filtros</button>
              : <Link className="button primary" href={APP_ROUTES.campaignCreate}>Nova campanha</Link>}
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !updating) setSelected(null);
        }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-status-title">
            <span className={`status status-${displayStatus(selected).toLowerCase()}`}>{statusLabels[displayStatus(selected)]}</span>
            <h2 id="campaign-status-title">{selected.status === "ACTIVE" ? "Pausar" : "Ativar"} “{selected.name}”?</h2>
            <p>{selected.status === "ACTIVE"
              ? "Ao pausar esta campanha, novas inscrições poderão ser interrompidas. Os dados já cadastrados serão preservados."
              : "Ao ativar esta campanha, a página pública poderá aceitar novas inscrições conforme as datas configuradas."}</p>
            {actionError && <p className="modal-error" role="alert">{actionError}</p>}
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => setSelected(null)} disabled={updating}>Cancelar</button>
              <button className="button primary" type="button" onClick={() => void updateStatus()} disabled={updating}>
                {updating ? "Salvando..." : selected.status === "ACTIVE" ? "Pausar campanha" : "Ativar campanha"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
