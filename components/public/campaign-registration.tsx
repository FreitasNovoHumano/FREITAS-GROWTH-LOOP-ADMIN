"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./campaign-registration.module.css";

type Campaign = {
  slug: string;
  title: string;
  description?: string | null;
  first_reward_title: string;
  first_reward_text?: string | null;
  first_reward_video_url?: string | null;
  first_reward_how_it_works_title?: string | null;
  first_reward_how_it_works_text?: string | null;
  first_reward_how_it_works_img_url?: string | null;
  second_reward_title: string;
  second_reward_subtitle?: string | null;
  second_reward_text?: string | null;
  second_reward_video_url?: string | null;
  second_reward_invite_title?: string | null;
  second_reward_invite_text?: string | null;
  thanks_title?: string | null;
  thanks_text?: string | null;
};

type RegistrationResponse = {
  lead?: { slug?: string };
  error?: string;
  message?: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

const initialForm: FormState = { name: "", email: "", phone: "", consent: false };

function normalizedPublicUrl(value?: string | null) {
  if (!value) return null;
  const candidate = value.trim().replace(/^<|>$/g, "");
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

async function responseBody(response: Response): Promise<RegistrationResponse> {
  try {
    return await response.json() as RegistrationResponse;
  } catch {
    return {};
  }
}

function apiErrorMessage(response: Response, body: RegistrationResponse) {
  return body.error ?? body.message ?? `Não foi possível concluir o cadastro (HTTP ${response.status}).`;
}

function CampaignMedia({ url, title }: { url?: string | null; title: string }) {
  const source = normalizedPublicUrl(url);
  if (!source) return null;

  return (
    <div className={styles.video}>
      <video controls preload="metadata" src={source} aria-label={title} />
    </div>
  );
}

export function CampaignRegistration({
  slug,
  invitedByLeadSlug,
}: {
  slug: string;
  invitedByLeadSlug?: string;
}) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign>();
  const [unavailable, setUnavailable] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setCampaign(undefined);
    setUnavailable(false);

    fetch(`/api/growth-loop/campaigns/${encodeURIComponent(slug)}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await responseBody(response);
        if (!response.ok) throw new Error(apiErrorMessage(response, body));
        return body as Campaign;
      })
      .then((value) => {
        setCampaign(value);
        document.title = `${value.title} | Growth Loop`;
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUnavailable(true);
      });

    return () => controller.abort();
  }, [slug]);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setFormError("");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/growth-loop/campaigns/${encodeURIComponent(slug)}/register`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          ...form,
          ...(invitedByLeadSlug ? { invited_by_lead_slug: invitedByLeadSlug } : {}),
        }),
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(apiErrorMessage(response, body));
      if (!body.lead?.slug) throw new Error("A API não retornou o slug do lead cadastrado.");

      router.push(`/c/${encodeURIComponent(slug)}/invite?lead_slug=${encodeURIComponent(body.lead.slug)}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  if (unavailable) {
    return (
      <section className={styles.unavailable} role="alert">
        <span aria-hidden="true">😲</span>
        <h1>Campanha não disponível</h1>
        <p>Não foi possível carregar esta campanha. Tente novamente mais tarde.</p>
      </section>
    );
  }

  if (!campaign) return <p className={styles.loading}>Carregando campanha…</p>;

  const howItWorksImage = normalizedPublicUrl(campaign.first_reward_how_it_works_img_url);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Campanha</p>
        <h1>{campaign.title}</h1>
        {campaign.description && <p>{campaign.description}</p>}
      </section>

      <section className={styles.rewardGrid} aria-label="Recompensas da campanha">
        <article className={styles.card}>
          <span>1ª recompensa</span>
          <h2>{campaign.first_reward_title}</h2>
          {campaign.first_reward_text && <p>{campaign.first_reward_text}</p>}
          <CampaignMedia url={campaign.first_reward_video_url} title={campaign.first_reward_title} />
        </article>
        <article className={styles.card}>
          <span>2ª recompensa</span>
          <h2>{campaign.second_reward_title}</h2>
          {campaign.second_reward_subtitle && <h3>{campaign.second_reward_subtitle}</h3>}
          {campaign.second_reward_text && <p>{campaign.second_reward_text}</p>}
          <CampaignMedia url={campaign.second_reward_video_url} title={campaign.second_reward_title} />
        </article>
      </section>

      {(campaign.first_reward_how_it_works_title || campaign.first_reward_how_it_works_text || howItWorksImage) && (
        <section className={styles.explanation}>
          <div>
            {campaign.first_reward_how_it_works_title && <h2>{campaign.first_reward_how_it_works_title}</h2>}
            {campaign.first_reward_how_it_works_text && <p>{campaign.first_reward_how_it_works_text}</p>}
          </div>
          {howItWorksImage && (
            <div className={styles.image}>
              <Image
                alt={campaign.first_reward_how_it_works_title ?? "Como funciona a campanha"}
                fill
                loader={({ src }) => src}
                sizes="(max-width: 900px) 100vw, 33vw"
                src={howItWorksImage}
                unoptimized
              />
            </div>
          )}
        </section>
      )}

      {(campaign.second_reward_invite_title || campaign.second_reward_invite_text) && (
        <section className={styles.inviteCopy}>
          {campaign.second_reward_invite_title && <h2>{campaign.second_reward_invite_title}</h2>}
          {campaign.second_reward_invite_text && <p>{campaign.second_reward_invite_text}</p>}
        </section>
      )}

      <form className={styles.form} onSubmit={register}>
        <h2>Quero participar</h2>
        {invitedByLeadSlug && (
          <input name="invited_by_lead_slug" type="hidden" value={invitedByLeadSlug} />
        )}
        <label>
          Nome
          <input
            autoComplete="name"
            maxLength={100}
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          E-mail
          <input
            autoComplete="email"
            maxLength={200}
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          WhatsApp <small>opcional</small>
          <input
            autoComplete="tel"
            maxLength={30}
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label className={styles.consent}>
          <input
            checked={form.consent}
            required
            type="checkbox"
            onChange={(event) => setForm({ ...form, consent: event.target.checked })}
          />
          <span>Concordo com os Termos de Uso e a Política de Privacidade.</span>
        </label>
        {formError && <div className={styles.alert} role="alert">{formError}</div>}
        <button disabled={submitting || !form.consent} type="submit">
          {submitting ? "Enviando…" : "Participar da campanha"}
        </button>
      </form>
    </div>
  );
}
