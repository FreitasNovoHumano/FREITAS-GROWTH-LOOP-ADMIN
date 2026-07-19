"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import styles from "./resource-table.module.css";

type RecordValue = Record<string, unknown>;
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
type CampaignOption = { id: string; name: string };

const configs = {
  leads: {
    columns: [["name", "Nome"], ["email", "E-mail"], ["phone", "Telefone"], ["campaign.name", "Campanha"], ["createdAt", "Capturado em"]],
    empty: "Nenhum lead capturado ainda.", search: "Buscar por nome, e-mail, telefone ou campanha",
  },
  participants: {
    columns: [["name", "Participante"], ["email", "E-mail"], ["campaign.name", "Campanha"], ["qualifiedReferralCount", "Qualificados"], ["status", "Status"]],
    empty: "Nenhum participante cadastrado ainda.", search: "Buscar por nome, e-mail, telefone ou campanha",
  },
  rewards: {
    columns: [["participant.name", "Participante"], ["reward.title", "Recompensa"], ["milestone", "Marco"], ["status", "Status"], ["grantedAt", "Liberada em"]],
    empty: "Nenhuma recompensa liberada ainda.", search: "Buscar por participante, recompensa ou marco",
  },
  fraud: {
    columns: [["participant.name", "Participante"], ["reason", "Motivo"], ["score", "Risco"], ["status", "Status"], ["createdAt", "Detectado em"]],
    empty: "Nenhum caso suspeito detectado.", search: "Buscar por participante, e-mail ou motivo",
  },
} as const;

const statusLabels: Record<string, string> = {
  PENDING: "Pendente", ACTIVE: "Ativo", BLOCKED: "Bloqueado", UNSUBSCRIBED: "Descadastrado",
  AVAILABLE: "Disponível", CLAIMED: "Resgatada", REVOKED: "Revogada", EXPIRED: "Expirada",
  OPEN: "Aberto", REVIEWING: "Em análise", CONFIRMED: "Confirmado", DISMISSED: "Descartado",
};
const positiveStatuses = new Set(["ACTIVE", "AVAILABLE", "CLAIMED", "DISMISSED"]);
const warningStatuses = new Set(["PENDING", "REVIEWING", "OPEN"]);

function get(row: RecordValue, path: string) {
  let value: unknown = row;
  for (const key of path.split(".")) value = (value as RecordValue | null)?.[key];
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  }
  return String(value ?? "—");
}

function statusTone(status: string) {
  if (positiveStatuses.has(status)) return styles.positive;
  if (warningStatuses.has(status)) return styles.warning;
  return styles.danger;
}

export function ResourceTable({ resource }: { resource: keyof typeof configs }) {
  const [rows, setRows] = useState<RecordValue[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [retry, setRetry] = useState(0);
  const config = configs[resource];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/campaigns", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<unknown> : [])
      .then((value) => setCampaigns(Array.isArray(value) ? value.filter((item): item is CampaignOption => Boolean(item && typeof item === "object" && "id" in item && "name" in item)) : []))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams({ page: String(pagination.page), pageSize: String(pagination.pageSize) });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (campaignId) params.set("campaignId", campaignId);
    return `/api/admin/data/${resource}?${params}`;
  }, [campaignId, debouncedQuery, pagination.page, pagination.pageSize, resource]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(requestUrl, { signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as { items?: unknown; pagination?: Pagination; error?: string };
        if (!response.ok) throw new Error(value.error || "Não foi possível carregar os dados.");
        if (!Array.isArray(value.items) || !value.pagination) throw new Error("Resposta inválida do servidor.");
        setRows(value.items as RecordValue[]);
        setPagination(value.pagination);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setRows([]);
        setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os dados.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requestUrl, retry]);

  const firstPage = () => setPagination((current) => ({ ...current, page: 1 }));

  return (
    <section className="panel table-panel">
      <div className={`table-toolbar ${styles.toolbar}`}>
        <label className={`search ${styles.search}`}>
          <Search size={17} aria-hidden="true" />
          <span className={styles.srOnly}>Buscar registros</span>
          <input type="search" placeholder={config.search} value={query} onChange={(event) => { setQuery(event.target.value); firstPage(); }} />
        </label>
        <div className={styles.filters}>
          <label>
            <span className={styles.srOnly}>Filtrar por campanha</span>
            <select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); firstPage(); }}>
              <option value="">Todas as campanhas</option>
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
            </select>
          </label>
          {resource === "leads" && <a href="/api/admin/export/leads" className="button secondary"><Download size={17} aria-hidden="true" /> Exportar CSV</a>}
        </div>
      </div>

      <div className="table-scroll" aria-busy={loading}>
        <table>
          <thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>
            {!loading && !error && rows.map((row, index) => (
              <tr key={`${resource}-${pagination.page}-${index}`}>
                {config.columns.map(([key, label]) => {
                  const rawStatus = key === "status" ? get(row, key) : "";
                  return <td key={key} data-label={label}>{key === "status" ? <span className={`status ${statusTone(rawStatus)}`}>{statusLabels[rawStatus] ?? rawStatus}</span> : get(row, key)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="table-empty" role="status">Carregando registros…</div>}
        {!loading && error && <div className={`table-empty ${styles.error}`} role="alert"><p>{error}</p><button type="button" className="button secondary" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div>}
        {!loading && !error && !rows.length && <div className="table-empty">{config.empty}</div>}
      </div>

      {!loading && !error && pagination.total > 0 && (
        <footer className={styles.pagination}>
          <span>{pagination.total} {pagination.total === 1 ? "registro" : "registros"}</span>
          <label>Por página<select value={pagination.pageSize} onChange={(event) => setPagination((current) => ({ ...current, page: 1, pageSize: Number(event.target.value) }))}>{[10, 20, 50, 100].map((size) => <option key={size}>{size}</option>)}</select></label>
          <div>
            <button type="button" className="button secondary" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Anterior</button>
            <span>Página {pagination.page} de {Math.max(pagination.totalPages, 1)}</span>
            <button type="button" className="button secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Próxima</button>
          </div>
        </footer>
      )}
    </section>
  );
}
