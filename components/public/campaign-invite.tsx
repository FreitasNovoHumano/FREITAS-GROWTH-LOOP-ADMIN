"use client";

import Image from "next/image";
import { Check, Copy, ExternalLink, Gift, MessageCircle, Send, Share2, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { productionAppUrl } from "@/lib/app-url";
import styles from "./campaign-invite.module.css";

type Campaign = {
  name?: string;
  title?: string;
  primaryColor?: string;
  initialRewardTitle?: string;
  initialRewardValue?: string | null;
  milestoneRewardTitle?: string;
  milestoneRewardValue?: string | null;
  qualifiedReferralGoal?: number;
  required_leads_for_second_reward?: number;
  first_reward_title?: string;
  first_reward_text?: string | null;
  second_reward_title?: string;
  second_reward_subtitle?: string | null;
  second_reward_text?: string | null;
  second_reward_video_url?: string | null;
  second_reward_invite_title?: string | null;
  second_reward_invite_text?: string | null;
  error?: string;
};

const leadSlugPattern = /^[A-Za-z0-9_-]{16,128}$/;

function safeHttpUrl(value?: string | null) {
  if (!value) return null;
  const normalizedValue = value.trim().replace(/^<|>$/g, "");
  try {
    const url = new URL(normalizedValue);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function youtubeEmbedUrl(value?: string | null) {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  if (url.username || url.password || url.port) return null;

  const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
  const videoId = url.hostname === "youtu.be"
    ? url.pathname.slice(1).split("/")[0]
    : youtubeHosts.has(url.hostname)
      ? url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v")
      : null;
  return videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : null;
}

function campaignErrorMessage(value: unknown) {
  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return "Não foi possível carregar esta campanha.";
}

export function CampaignInvite({ campaignSlug, leadSlug }: { campaignSlug: string; leadSlug?: string }) {
  const [campaign, setCampaign] = useState<Campaign>();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  const validLeadSlug = Boolean(leadSlug && leadSlugPattern.test(leadSlug));
  const inviteUrl = useMemo(() => validLeadSlug
    ? productionAppUrl(`/c/${encodeURIComponent(campaignSlug)}?invited_by_lead_slug=${encodeURIComponent(leadSlug!)}`)
    : "", [campaignSlug, leadSlug, validLeadSlug]);
  const rewardUrl = validLeadSlug
    ? productionAppUrl(`/api/campaigns/${encodeURIComponent(campaignSlug)}/leads/${encodeURIComponent(leadSlug!)}/claim_reward`)
    : "";

  useEffect(() => {
    if (!validLeadSlug) {
      setError("Link de participante inválido ou ausente.");
      return;
    }

    const controller = new AbortController();
    fetch(`/api/growth-loop/campaigns/${encodeURIComponent(campaignSlug)}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(campaignErrorMessage(body));
        return body as Campaign;
      })
      .then((value) => {
        setCampaign(value);
        document.title = `Compartilhe ${value.title ?? value.name ?? "sua campanha"} | Growth Loop`;
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Campanha não disponível.");
      });

    return () => controller.abort();
  }, [campaignSlug, validLeadSlug]);

  async function copyInviteLink() {
    setShareError("");
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      setShareError("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.");
    }
  }

  async function shareInviteLink() {
    setShareError("");
    const campaignName = campaign?.title ?? campaign?.name ?? "esta campanha";
    const text = `Participe de ${campaignName} pelo meu convite e desbloqueie sua recompensa.`;
    if (!navigator.share) {
      await copyInviteLink();
      return;
    }
    try {
      await navigator.share({ title: campaignName, text, url: inviteUrl });
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        setShareError("O compartilhamento não foi concluído. Você ainda pode copiar o link.");
      }
    }
  }

  async function shareOnInstagram(message: string) {
    setShareError("");
    const instagramWindow = window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(`${message} ${inviteUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
      if (!instagramWindow) {
        setShareError("A mensagem foi copiada. Abra o Instagram e cole-a na publicação desejada.");
      }
    } catch {
      setShareError("O Instagram foi aberto, mas não foi possível copiar a mensagem. Copie o link manualmente.");
    }
  }

  if (error) {
    return (
      <section className={styles.unavailable} role="alert">
        <span aria-hidden="true">😲</span>
        <h1>Campanha não disponível</h1>
        <p>{error}</p>
      </section>
    );
  }

  if (!campaign) return <p className={styles.loading}>Preparando seu link exclusivo…</p>;

  const campaignName = campaign.title ?? campaign.name ?? "Growth Loop";
  const firstRewardTitle = campaign.first_reward_title ?? campaign.initialRewardTitle ?? "Recompensa inicial";
  const firstRewardText = campaign.first_reward_text ?? campaign.initialRewardValue;
  const secondRewardTitle = campaign.second_reward_title ?? campaign.milestoneRewardTitle ?? "Próxima recompensa";
  const secondRewardText = campaign.second_reward_text ?? campaign.milestoneRewardValue;
  const goal = campaign.required_leads_for_second_reward ?? campaign.qualifiedReferralGoal ?? 1;
  const shareMessage = `Participe de ${campaignName} pelo meu convite e receba ${firstRewardTitle}.`;
  const encodedInviteUrl = encodeURIComponent(inviteUrl);
  const encodedShareMessage = encodeURIComponent(shareMessage);
  const socialLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedInviteUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${inviteUrl}`)}`,
    twitter: `https://x.com/intent/post?text=${encodedShareMessage}&url=${encodedInviteUrl}`,
  };
  const secondRewardVideoUrl = safeHttpUrl(campaign.second_reward_video_url);
  const secondRewardYoutubeUrl = youtubeEmbedUrl(campaign.second_reward_video_url);

  return (
    <section className={styles.page} style={{ "--campaign-color": campaign.primaryColor ?? "#7c3aed" } as React.CSSProperties}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <Image src="/freitas-loop.png" alt="Freitas Growth Loop" width={46} height={46} priority />
          <span>Freitas Growth <b>Loop</b></span>
        </div>
        <span className={styles.successBadge}><Check size={16} /> Inscrição concluída</span>
        <h1>Você entrou no loop.<br /><em>Agora faça ele crescer.</em></h1>
        <p>Sua recompensa está pronta e seu link exclusivo já pode ser compartilhado.</p>
      </header>

      <div className={styles.rewardGrid}>
        <article className={`${styles.card} ${styles.firstReward}`}>
          <span className={styles.icon}><Gift /></span>
          <div>
            <small>Disponível agora</small>
            <h2>{firstRewardTitle}</h2>
            {firstRewardText && <p>{firstRewardText}</p>}
          </div>
          <a className={styles.primaryButton} href={rewardUrl}>
            Acessar recompensa <ExternalLink size={17} />
          </a>
        </article>

        <article className={styles.card}>
          <span className={styles.icon}><Sparkles /></span>
          <div>
            <small>Próxima conquista</small>
            <h2>{secondRewardTitle}</h2>
            {campaign.second_reward_subtitle && <strong>{campaign.second_reward_subtitle}</strong>}
            {secondRewardText && <p>{secondRewardText}</p>}
          </div>
          <div className={styles.goal}>
            <Users size={18} />
            <span><b>{goal}</b> {goal === 1 ? "amigo precisa" : "amigos precisam"} se cadastrar e resgatar a recompensa</span>
          </div>
        </article>
      </div>

      {secondRewardVideoUrl && (
        <article className={styles.videoCard}>
          <div>
            <small>Conheça a próxima recompensa</small>
            <h2>{secondRewardTitle}</h2>
          </div>
          <div className={styles.videoFrame}>
            {secondRewardYoutubeUrl ? (
              <iframe
                src={secondRewardYoutubeUrl}
                title={`Vídeo sobre ${secondRewardTitle}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={secondRewardVideoUrl} controls preload="metadata">
                Seu navegador não suporta a reprodução deste vídeo.
              </video>
            )}
          </div>
        </article>
      )}

      <article className={styles.shareCard}>
        <div className={styles.shareIntro}>
          <span><Share2 /></span>
          <div>
            <small>Seu próximo passo</small>
            <h2>{campaign.second_reward_invite_title ?? "Convide seus amigos"}</h2>
            <p>{campaign.second_reward_invite_text ?? `Compartilhe seu link. Quando ${goal} convidados resgatarem a primeira recompensa, você desbloqueia ${secondRewardTitle}.`}</p>
          </div>
        </div>

        <div className={styles.linkBox}>
          <label htmlFor="invite-link">Seu link exclusivo</label>
          <div>
            <input id="invite-link" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />
            <button type="button" onClick={copyInviteLink} aria-label="Copiar link de indicação">
              {copied ? <Check /> : <Copy />}<span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
        </div>

        {shareError && <p className={styles.alert} role="alert">{shareError}</p>}

        <div className={styles.shareActions}>
          <button type="button" className={styles.shareButton} onClick={shareInviteLink}>
            <Send size={18} /> Compartilhar
          </button>
        </div>

        <div className={styles.socialGrid} aria-label="Compartilhar nas redes sociais">
          <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="Compartilhar no LinkedIn">
            <b className={styles.socialMark} aria-hidden="true">in</b> <span>LinkedIn</span>
          </a>
          <button type="button" onClick={() => shareOnInstagram(shareMessage)} aria-label="Copiar mensagem e abrir o Instagram">
            <b className={styles.socialMark} aria-hidden="true">◎</b> <span>Instagram</span>
          </button>
          <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" aria-label="Compartilhar no WhatsApp">
            <MessageCircle aria-hidden="true" /> <span>WhatsApp</span>
          </a>
          <a href={socialLinks.twitter} target="_blank" rel="noreferrer" aria-label="Compartilhar no X, antigo Twitter">
            <b aria-hidden="true">𝕏</b> <span>Twitter / X</span>
          </a>
        </div>
      </article>

      <footer className={styles.note}>
        <Sparkles size={15} /> Cada amigo deve concluir o cadastro e acessar a primeira recompensa para contar na meta.
      </footer>
    </section>
  );
}
