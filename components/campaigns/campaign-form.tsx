"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Link2,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmbedConfigurationFields } from "@/components/campaigns/embed-configuration-fields";
import type { EmbedConfiguration } from "@/lib/embed-config";
import { normalizeCampaignSlug } from "@/lib/slug";

type CampaignFormData = EmbedConfiguration & {
  name: string;
  slug: string;
  description: string;
  initialRewardTitle: string;
  initialRewardValue: string;
  milestoneRewardTitle: string;
  milestoneRewardValue: string;
  qualifiedReferralGoal: number;
  primaryColor: string;
};

const initialData: CampaignFormData = {
  name: "",
  slug: "",
  description: "",
  initialRewardTitle: "Guia exclusivo de crescimento",
  initialRewardValue: "Acesso imediato",
  milestoneRewardTitle: "Consultoria estratégica",
  milestoneRewardValue: "Sessão de 45 minutos",
  qualifiedReferralGoal: 3,
  primaryColor: "#7c3aed",
  embedButtonLabel: "Participar agora",
  embedButtonIcon: "none",
  embedButtonStyle: "solid",
  embedPosition: "bottom-right",
  embedDelayMs: 0,
  embedAnimation: "fade",
  embedInitiallyExpanded: false,
};

export function CampaignForm({ publicOrigin }: { publicOrigin: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [data, setData] = useState(initialData);

  function set<Key extends keyof CampaignFormData>(
    key: Key,
    value: CampaignFormData[Key],
  ) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function setEmbed<Key extends keyof EmbedConfiguration>(
    key: Key,
    value: EmbedConfiguration[Key],
  ) {
    setData((current) => ({ ...current, [key]: value }));
  }

  const publicAddress = `${publicOrigin}/growth-loop/${data.slug || "seu-slug"}`;

  function updateName(name: string) {
    setData((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : normalizeCampaignSlug(name),
    }));
    setSlugError("");
  }

  function updateSlug(value: string) {
    const slug = normalizeCampaignSlug(value);
    setSlugEdited(true);
    set("slug", slug);
    setSlugError(
      slug.length > 0 && slug.length < 3
        ? "O slug deve ter pelo menos 3 caracteres."
        : "",
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSlugError("");

    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const fieldMessage = body?.fields?.slug?.[0];
        if (fieldMessage) {
          setSlugError(fieldMessage);
          setSaving(false);
          return;
        }
        throw new Error(body?.error || "Não foi possível criar.");
      }
      router.push("/dashboard/campaigns");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="builder">
      <div className="builder-main">
        <Link href="/dashboard/campaigns" className="back">
          <ArrowLeft size={16} /> Campanhas
        </Link>

        <PageStep
          icon={<Target />}
          number="01"
          title="A campanha"
          description="Defina uma proposta clara e fácil de compartilhar."
        >
          <div className="form-grid">
            <label>
              Nome da campanha
              <input
                required
                value={data.name}
                onChange={(event) => updateName(event.target.value)}
                placeholder="Ex.: Indique & Ganhe"
              />
            </label>
            <label>
              Slug
              <input
                required
                minLength={3}
                maxLength={100}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={data.slug}
                onChange={(event) => updateSlug(event.target.value)}
                placeholder="indique-e-ganhe"
                aria-describedby="slug-help slug-error"
                aria-invalid={Boolean(slugError)}
              />
              <small id="slug-help" className="field-help">
                Identificador curto, sem espaços ou acentos.
              </small>
              {slugError && (
                <small id="slug-error" className="field-error" role="alert">
                  {slugError}
                </small>
              )}
            </label>
            <label className="full">
              Endereço público
              <span className="public-address-field">
                <Link2 size={17} aria-hidden="true" />
                <input readOnly value={publicAddress} aria-label="Endereço público gerado" />
              </span>
              <small className="field-help">
                Gerado automaticamente a partir do slug.
              </small>
            </label>
            <label className="full">
              Descrição
              <textarea
                value={data.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Conte por que vale a pena participar..."
              />
            </label>
          </div>
        </PageStep>

        <PageStep
          icon={<Gift />}
          number="02"
          title="Recompensas"
          description="Entregue valor logo no cadastro e celebre o marco de indicações."
        >
          <div className="reward-fields">
            <div>
              <span className="step-pill">RECOMPENSA INICIAL</span>
              <label>
                Título
                <input
                  required
                  value={data.initialRewardTitle}
                  onChange={(event) => set("initialRewardTitle", event.target.value)}
                />
              </label>
              <label>
                Valor ou descrição
                <input
                  value={data.initialRewardValue}
                  onChange={(event) => set("initialRewardValue", event.target.value)}
                />
              </label>
            </div>
            <div>
              <span className="step-pill warm">MARCO DE INDICAÇÕES</span>
              <label>
                Título
                <input
                  required
                  value={data.milestoneRewardTitle}
                  onChange={(event) => set("milestoneRewardTitle", event.target.value)}
                />
              </label>
              <label>
                Quantidade qualificada
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.qualifiedReferralGoal}
                  onChange={(event) =>
                    set("qualifiedReferralGoal", Number(event.target.value))
                  }
                />
              </label>
            </div>
          </div>
        </PageStep>

        <PageStep
          icon={<Palette />}
          number="03"
          title="Identidade"
          description="Use a cor principal da sua marca."
        >
          <label>
            Cor principal
            <span className="color-input">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(event) => set("primaryColor", event.target.value)}
              />
              <code>{data.primaryColor}</code>
            </span>
          </label>
        </PageStep>

        <PageStep
          icon={<Sparkles />}
          number="04"
          title="Widget no site"
          description="Defina como e quando o convite da campanha aparece para o visitante."
        >
          <EmbedConfigurationFields
            value={data}
            primaryColor={data.primaryColor}
            onChange={setEmbed}
          />
        </PageStep>

        {error && <p className="form-error">{error}</p>}
        <div className="builder-footer">
          <span><Check size={16} /> As regras serão versionadas e preservadas.</span>
          <button className="button primary" disabled={saving}>
            {saving ? "Criando..." : "Criar campanha"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <aside className="preview-panel">
        <span className="eyebrow">PRÉVIA DA EXPERIÊNCIA</span>
        <div
          className="phone-preview"
          style={{ "--brand": data.primaryColor } as React.CSSProperties}
        >
          <span className="preview-brand">GROWTH LOOP</span>
          <h2>{data.name || "Sua próxima grande campanha"}</h2>
          <p>
            {data.description ||
              "Cadastre-se, receba sua primeira recompensa e convide seus amigos."}
          </p>
          <button type="button">Quero participar</button>
          <div className="preview-reward">
            <Gift />
            <span>
              <small>VOCÊ RECEBE AGORA</small>
              <strong>{data.initialRewardTitle}</strong>
            </span>
          </div>
          <div className="progress-dots">
            {Array.from(
              { length: Math.min(data.qualifiedReferralGoal, 5) },
              (_, index) => <i key={index}>{index + 1}</i>,
            )}
          </div>
          <small>
            Indique {data.qualifiedReferralGoal} amigos e desbloqueie mais
          </small>
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
        <span>{icon}</span>
        <div>
          <small>{number}</small>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
