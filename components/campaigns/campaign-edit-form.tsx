"use client";

import Link from "next/link";
import { ArrowLeft, Check, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_API_ROUTES, APP_ROUTES } from "@/lib/routes";

type EditableCampaign = {
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED" | "ARCHIVED";
  startsAt: string;
  endsAt: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  initialRewardTitle: string;
  initialRewardValue: string;
  milestoneRewardTitle: string;
  milestoneRewardValue: string;
  qualifiedReferralGoal: number;
};

function dateTimeInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function CampaignEditForm({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<EditableCampaign>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof EditableCampaign, value: string | number) => setData((current) => current ? { ...current, [key]: value } : current);

  function load() {
    setLoading(true); setError("");
    fetch(ADMIN_API_ROUTES.campaign(id))
      .then(async (response) => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar."); return body; })
      .then((value) => setData({
        name: value.name, slug: value.slug, description: value.description ?? "", status: value.status,
        startsAt: dateTimeInput(value.startsAt), endsAt: dateTimeInput(value.endsAt), primaryColor: value.primaryColor,
        accentColor: value.accentColor, logoUrl: value.logoUrl ?? "", initialRewardTitle: value.initialRewardTitle,
        initialRewardValue: value.initialRewardValue ?? "", milestoneRewardTitle: value.milestoneRewardTitle,
        milestoneRewardValue: value.milestoneRewardValue ?? "", qualifiedReferralGoal: value.qualifiedReferralGoal,
      }))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!data || saving) return;
    setSaving(true); setError("");
    const response = await fetch(ADMIN_API_ROUTES.campaign(id), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, startsAt: data.startsAt || null, endsAt: data.endsAt || null, logoUrl: data.logoUrl || null }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? "Não foi possível salvar a campanha."); setSaving(false); return; }
    router.push(APP_ROUTES.campaignDetails(id)); router.refresh();
  }

  if (loading) return <div className="panel state-card">Carregando configurações…</div>;
  if (!data) return <div className="panel state-card error-state"><p>{error}</p><button className="button secondary" onClick={load}><RefreshCw size={16}/> Tentar novamente</button></div>;

  return <form className="builder edit-builder" onSubmit={submit}><div className="builder-main">
    <Link href={APP_ROUTES.campaignDetails(id)} className="back"><ArrowLeft size={16}/> Voltar aos detalhes</Link>
    <section className="form-section"><div className="form-section-title"><span><Check/></span><div><small>01</small><h2>Informações básicas</h2><p>Dados públicos e ciclo de vida da campanha.</p></div></div><div className="form-grid">
      <label>Nome<input required minLength={3} maxLength={100} value={data.name} onChange={(e)=>set("name",e.target.value)}/></label>
      <label>Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={data.slug} onChange={(e)=>set("slug",e.target.value.toLowerCase())}/></label>
      <label className="full">Descrição<textarea maxLength={500} value={data.description} onChange={(e)=>set("description",e.target.value)}/></label>
      <label>Status<select value={data.status} onChange={(e)=>set("status",e.target.value)}><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativa</option><option value="PAUSED">Pausada</option><option value="ENDED">Encerrada</option><option value="ARCHIVED">Arquivada</option></select></label>
      <label>Início<input type="datetime-local" value={data.startsAt} onChange={(e)=>set("startsAt",e.target.value)}/></label>
      <label>Encerramento<input type="datetime-local" value={data.endsAt} onChange={(e)=>set("endsAt",e.target.value)}/></label>
      <label>Logo por URL<input type="url" value={data.logoUrl} onChange={(e)=>set("logoUrl",e.target.value)}/></label>
    </div></section>
    <section className="form-section"><div className="form-section-title"><span><Save/></span><div><small>02</small><h2>Recompensas</h2><p>Títulos, valores e meta de indicações.</p></div></div><div className="reward-fields">
      <div><span className="step-pill">INICIAL</span><label>Título<input required value={data.initialRewardTitle} onChange={(e)=>set("initialRewardTitle",e.target.value)}/></label><label>Descrição<input value={data.initialRewardValue} onChange={(e)=>set("initialRewardValue",e.target.value)}/></label></div>
      <div><span className="step-pill warm">INDICAÇÕES</span><label>Título<input required value={data.milestoneRewardTitle} onChange={(e)=>set("milestoneRewardTitle",e.target.value)}/></label><label>Descrição<input value={data.milestoneRewardValue} onChange={(e)=>set("milestoneRewardValue",e.target.value)}/></label><label>Meta<input type="number" min="1" max="100" value={data.qualifiedReferralGoal} onChange={(e)=>set("qualifiedReferralGoal",Number(e.target.value))}/></label></div>
    </div></section>
    <section className="form-section"><div className="form-section-title"><span><Save/></span><div><small>03</small><h2>Identidade</h2><p>Cores já suportadas pelo modelo.</p></div></div><div className="form-grid"><label>Cor principal<input type="color" value={data.primaryColor} onChange={(e)=>set("primaryColor",e.target.value)}/></label><label>Cor de destaque<input type="color" value={data.accentColor} onChange={(e)=>set("accentColor",e.target.value)}/></label></div></section>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="builder-footer"><span><Check size={16}/> Alterações registradas na auditoria.</span><button className="button primary" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}<Save size={17}/></button></div>
  </div></form>;
}
