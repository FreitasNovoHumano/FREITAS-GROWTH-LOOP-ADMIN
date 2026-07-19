"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { productionAppUrl } from "@/lib/app-url";

type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string;
  qualifiedReferralGoal: number;
  _count: { participants: number; leads: number; referrals: number };
};

export function CampaignManager() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = () => fetch("/api/admin/campaigns")
    .then((response) => response.json())
    .then((value) => setItems(Array.isArray(value) ? value : []))
    .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);
  const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar campanha..." />
        </label>
        <select aria-label="Status">
          <option>Todos os status</option><option>Ativa</option><option>Rascunho</option>
        </select>
      </div>
      <section className="campaign-grid">
        {loading
          ? <div className="empty">Carregando campanhas...</div>
          : filtered.map((campaign) => (
            <article className="campaign-card" key={campaign.id}>
              <div className="campaign-cover">
                <span className="status active">{campaign.status}</span>
                <button aria-label="Mais opções"><MoreHorizontal /></button>
                <strong>{campaign.name.slice(0, 2).toUpperCase()}</strong>
              </div>
              <div className="campaign-content">
                <h2>{campaign.name}</h2>
                <p>{campaign.description || "Campanha de indicação Growth Loop"}</p>
                <div className="campaign-stats">
                  <span><Users /> <strong>{campaign._count.participants}</strong><small>Participantes</small></span>
                  <span><ExternalLink /> <strong>{campaign._count.referrals}</strong><small>Indicações</small></span>
                </div>
                <div className="card-actions">
                  <Link href={productionAppUrl(`/c/${campaign.slug}`)} target="_blank">Abrir página</Link>
                  <button onClick={async () => {
                    await fetch(`/api/admin/campaigns/${campaign.id}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ status: campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
                    });
                    void load();
                  }}>
                    {campaign.status === "ACTIVE" ? "Pausar" : "Ativar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        {!loading && !filtered.length && (
          <div className="empty">
            <Plus /><h3>Crie seu primeiro loop</h3>
            <p>Uma campanha bem desenhada transforma cada cliente em um canal de aquisição.</p>
            <Link className="button primary" href={productionAppUrl("/dashboard/campaigns/new")}>Nova campanha</Link>
          </div>
        )}
      </section>
    </>
  );
}
