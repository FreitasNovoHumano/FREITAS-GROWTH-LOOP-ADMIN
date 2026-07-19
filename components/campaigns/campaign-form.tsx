"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Gift, Palette, Target } from "lucide-react";
import Link from "next/link";
import { ADMIN_API_ROUTES, APP_ROUTES } from "@/lib/routes";

export function CampaignForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    name: "",
    slug: "",
    description: "",
    initialRewardTitle: "",
    initialRewardValue: "",
    milestoneRewardTitle: "",
    milestoneRewardValue: "",
    qualifiedReferralGoal: 3,
    primaryColor: "#7c3aed",
  });
  const set = (key: string, value: string | number) => setData((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(ADMIN_API_ROUTES.campaigns, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "Não foi possível criar a campanha.");
        return;
      }
      router.push(APP_ROUTES.campaigns);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="builder">
      <div className="builder-main">
        <Link href={APP_ROUTES.campaigns} className="back">
          <ArrowLeft size={16} /> Campanhas
        </Link>
        <PageStep icon={<Target />} number="01" title="A campanha" description="Defina uma proposta clara e fácil de compartilhar.">
          <div className="form-grid">
            <label>
              Nome da campanha
              <input
                required
                value={data.name}
                onChange={(event) => {
                  set("name", event.target.value);
                  set("slug", event.target.value.toLowerCase().normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                placeholder="Ex.: Indique & Ganhe"
              />
            </label>
            <label>
              Endereço público
              <input required value={data.slug} onChange={(event) => set("slug", event.target.value)} placeholder="indique-e-ganhe" />
            </label>
            <label className="full">
              Descrição
              <textarea value={data.description} onChange={(event) => set("description", event.target.value)} placeholder="Conte por que vale a pena participar..." />
            </label>
          </div>
        </PageStep>
        <PageStep icon={<Gift />} number="02" title="Recompensas" description="Entregue valor logo no cadastro e celebre o marco de indicações.">
          <div className="reward-fields">
            <div>
              <span className="step-pill">RECOMPENSA INICIAL</span>
              <label>Título<input required value={data.initialRewardTitle} onChange={(event) => set("initialRewardTitle", event.target.value)} placeholder="Ex.: Guia exclusivo" /></label>
              <label>Valor ou descrição<input value={data.initialRewardValue} onChange={(event) => set("initialRewardValue", event.target.value)} placeholder="Ex.: Acesso imediato" /></label>
            </div>
            <div>
              <span className="step-pill warm">MARCO DE INDICAÇÕES</span>
              <label>Título<input required value={data.milestoneRewardTitle} onChange={(event) => set("milestoneRewardTitle", event.target.value)} placeholder="Ex.: Consultoria estratégica" /></label>
              <label>Valor ou descrição<input value={data.milestoneRewardValue} onChange={(event) => set("milestoneRewardValue", event.target.value)} placeholder="Ex.: Sessão de 45 minutos" /></label>
              <label>Quantidade qualificada<input type="number" min="1" max="100" value={data.qualifiedReferralGoal} onChange={(event) => set("qualifiedReferralGoal", Number(event.target.value))} /></label>
            </div>
          </div>
        </PageStep>
        <PageStep icon={<Palette />} number="03" title="Identidade" description="Use a cor principal da sua marca.">
          <label>
            Cor principal
            <span className="color-input">
              <input type="color" value={data.primaryColor} onChange={(event) => set("primaryColor", event.target.value)} />
              <code>{data.primaryColor}</code>
            </span>
          </label>
        </PageStep>
        {error && <p className="form-error">{error}</p>}
        <div className="builder-footer">
          <span><Check size={16} /> As regras serão versionadas e preservadas.</span>
          <button className="button primary" disabled={saving}>
            {saving ? "Criando..." : "Criar campanha"}<ArrowRight size={17} />
          </button>
        </div>
      </div>
      <aside className="preview-panel">
        <span className="eyebrow">PRÉVIA DA EXPERIÊNCIA</span>
        <div className="phone-preview" style={{ "--brand": data.primaryColor } as React.CSSProperties}>
          <span className="preview-brand">GROWTH LOOP</span>
          <h2>{data.name || "Sua próxima grande campanha"}</h2>
          <p>{data.description || "Cadastre-se, receba sua primeira recompensa e convide seus amigos."}</p>
          <button>Quero participar</button>
          <div className="preview-reward"><Gift /><span><small>VOCÊ RECEBE AGORA</small><strong>{data.initialRewardTitle}</strong></span></div>
          <div className="progress-dots">
            {Array.from({ length: Math.min(data.qualifiedReferralGoal, 5) }, (_, index) => <i key={index}>{index + 1}</i>)}
          </div>
          <small>Indique {data.qualifiedReferralGoal} amigos e desbloqueie mais</small>
        </div>
      </aside>
    </form>
  );
}

function PageStep({
  icon,
  number,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-title">
        <span>{icon}</span><div><small>{number}</small><h2>{title}</h2><p>{description}</p></div>
      </div>
      {children}
    </section>
  );
}
