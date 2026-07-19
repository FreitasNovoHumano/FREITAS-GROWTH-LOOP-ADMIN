"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { productionAppUrl } from "@/lib/app-url";

type RecordValue = Record<string, unknown>;

const configs = {
  leads: {
    columns: [["name", "Nome"], ["email", "E-mail"], ["phone", "Telefone"], ["campaign.name", "Campanha"], ["createdAt", "Capturado em"]],
    empty: "Nenhum lead capturado ainda.",
  },
  participants: {
    columns: [["name", "Participante"], ["email", "E-mail"], ["campaign.name", "Campanha"], ["qualifiedReferralCount", "Qualificados"], ["status", "Status"]],
    empty: "Nenhum participante cadastrado ainda.",
  },
  rewards: {
    columns: [["participant.name", "Participante"], ["reward.title", "Recompensa"], ["milestone", "Marco"], ["status", "Status"], ["grantedAt", "Liberada em"]],
    empty: "Nenhuma recompensa liberada ainda.",
  },
  fraud: {
    columns: [["participant.name", "Participante"], ["reason", "Motivo"], ["score", "Risco"], ["status", "Status"], ["createdAt", "Detectado em"]],
    empty: "Nenhum caso suspeito detectado.",
  },
} as const;

function get(row: RecordValue, path: string) {
  let value: unknown = row;
  for (const key of path.split(".")) value = (value as RecordValue)?.[key];
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString("pt-BR");
  }
  return String(value ?? "—");
}

export function ResourceTable({ resource }: { resource: keyof typeof configs }) {
  const [rows, setRows] = useState<RecordValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`/api/admin/data/${resource}`)
      .then((response) => response.json())
      .then((value) => setRows(Array.isArray(value) ? value : []))
      .finally(() => setLoading(false));
  }, [resource]);

  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const config = configs[resource];

  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <label className="search">
          <Search size={17} />
          <input placeholder="Buscar..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {resource === "leads" && (
          <a href={productionAppUrl("/api/admin/export/leads")} className="button secondary">
            <Download size={17} /> Exportar CSV
          </a>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {config.columns.map(([key]) => (
                  <td key={key}>{key === "status" ? <span className="status active">{get(row, key)}</span> : get(row, key)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="table-empty">Carregando...</div>}
        {!loading && !filtered.length && <div className="table-empty">{config.empty}</div>}
      </div>
    </section>
  );
}
