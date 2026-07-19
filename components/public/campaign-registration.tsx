"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import styles from "./campaign-registration.module.css";

type Campaign = {
  slug: string;
  title: string;
  status?: boolean;
  primaryColor?: string | null;
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

function youtubeEmbedUrl(value?: string | null) {
  const source = normalizedPublicUrl(value);
  if (!source) return null;
  const url = new URL(source);
  if (url.username || url.password || url.port) return null;
  const allowedHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
  const videoId = url.hostname === "youtu.be"
    ? url.pathname.slice(1).split("/")[0]
    : allowedHosts.has(url.hostname)
      ? url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v")
      : null;
  return videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : null;
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
  const youtubeSource = youtubeEmbedUrl(url);

  return (
    <div className={styles.video}>
      {youtubeSource ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          src={youtubeSource}
          title={title}
        />
      ) : source ? (
        <video controls preload="metadata" src={source} aria-label={title} />
      ) : (
        <div className={styles.videoPlaceholder} aria-label="Vídeo não configurado">
          <Play aria-hidden="true" />
        </div>
      )}
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
        if (value.status === false) throw new Error("Campanha indisponível");
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

  const howItWorksImage = youtubeEmbedUrl(campaign.first_reward_how_it_works_img_url)
    ? null
    : normalizedPublicUrl(campaign.first_reward_how_it_works_img_url);

  return (
    <div className={styles.page} style={{ "--campaign-color": campaign.primaryColor ?? "#8b5cf6" } as React.CSSProperties}>
      <header className={styles.hero}>
        <span>Campanha · {campaign.title}</span>
        <h1>{campaign.first_reward_title}</h1>
      </header>

      <section className={styles.registrationGrid}>
        <CampaignMedia url={campaign.first_reward_video_url} title={campaign.first_reward_title} />
        <div className={styles.signupPanel}>
          <p>{campaign.first_reward_text ?? campaign.description}</p>
          <form className={styles.form} onSubmit={register}>
            {invitedByLeadSlug && (
              <input name="invited_by_lead_slug" type="hidden" value={invitedByLeadSlug} />
            )}
            <label>
              <span>Nome</span>
              <input autoComplete="name" maxLength={100} placeholder="Seu nome" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              <span>E-mail</span>
              <input autoComplete="email" maxLength={200} placeholder="voce@email.com" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              <span>WhatsApp</span>
              <input autoComplete="tel" maxLength={30} placeholder="(00) 00000-0000" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className={styles.consent}>
              <input checked={form.consent} required type="checkbox" onChange={(event) => setForm({ ...form, consent: event.target.checked })} />
              <span>Concordo com os Termos de Uso e a Política de Privacidade.</span>
            </label>
            {formError && <div className={styles.alert} role="alert">{formError}</div>}
            <button disabled={submitting || !form.consent} type="submit">
              {submitting ? "Enviando…" : "Acessar agora"}
            </button>
          </form>
        </div>
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
    </div>
  );
}
