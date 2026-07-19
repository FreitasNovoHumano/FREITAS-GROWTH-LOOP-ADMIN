"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2, Sparkles, Users } from "lucide-react";

type Campaign = {
  name: string;
  slug: string;
  description?: string;
  primaryColor: string;
  initialRewardTitle: string;
  initialRewardValue?: string;
  milestoneRewardTitle: string;
  qualifiedReferralGoal: number;
  page?: { headline: string; subheadline?: string; ctaLabel: string };
};

type Registration = { participantId: string; referralCode: string; accessToken: string };

export function JoinExperience({ slug, ref }: { slug: string; ref?: string }) {
  const [campaign, setCampaign] = useState<Campaign>();
  const [error, setError] = useState("");
  const [result, setResult] = useState<Registration>();
  const [form, setForm] = useState({ name: "", email: "", phone: "", consent: false });

  useEffect(() => {
    fetch(`/api/growth-loop/campaigns/${slug}`)
      .then((response) => response.json())
      .then((value) => value.error ? setError(value.error) : setCampaign(value));
  }, [slug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/growth-loop/campaigns/${slug}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, referralCode: ref }),
    });
    const value = await response.json();
    if (!response.ok) {
      setError(value.error);
      return;
    }
    setResult(value);
    await fetch(`/api/public/participants/${value.participantId}/reward-access`, {
      method: "POST",
      headers: { authorization: `Bearer ${value.accessToken}` },
    });
  }

  if (error) return <main className="public-error"><h1>Este loop não está disponível.</h1><p>{error}</p></main>;
  if (!campaign) return <main className="public-loading">Preparando sua experiência...</main>;

  const url = typeof window !== "undefined"
    ? `${location.origin}/growth-loop/${slug}?ref=${result?.referralCode}`
    : "";

  return <main className="public-shell" style={{ "--brand": campaign.primaryColor } as React.CSSProperties}>
    <nav><span>GROWTH <b>LOOP</b></span><small>por Freitas Growth AI</small></nav>
    {!result ? <>
      <section className="public-hero">
        <span className="eyebrow"><Sparkles /> CONVITE ESPECIAL</span>
        <h1>{campaign.page?.headline || campaign.name}</h1>
        <p>{campaign.page?.subheadline || campaign.description}</p>
        <div className="reward-promise"><Gift /><span><small>CADASTRE-SE E RECEBA</small><strong>{campaign.initialRewardTitle}</strong><em>{campaign.initialRewardValue}</em></span></div>
      </section>
      <form onSubmit={submit} className="join-card">
        <h2>Entre para o loop</h2><p>Leva menos de um minuto.</p>
        <label>Seu nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Como podemos chamar você?" /></label>
        <label>Seu melhor e-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@empresa.com" /></label>
        <label>WhatsApp <span>opcional</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="(11) 99999-9999" /></label>
        <label className="check"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /><span>Li e concordo com os Termos e a Política de Privacidade.</span></label>
        <button disabled={!form.consent}>{campaign.page?.ctaLabel || "Quero participar"}</button>
      </form>
    </> : <section className="success-card">
      <span className="success-icon"><Check /></span><span className="eyebrow">VOCÊ ESTÁ NO LOOP</span>
      <h1>Primeira recompensa desbloqueada!</h1>
      <div className="unlocked"><Gift /><span><small>SEU PRESENTE</small><strong>{campaign.initialRewardTitle}</strong><em>{campaign.initialRewardValue}</em></span></div>
      <div className="next-step"><Users /><span><h2>Agora, convide {campaign.qualifiedReferralGoal} amigos</h2><p>Quando eles concluírem o cadastro e acessarem a primeira recompensa, você recebe <strong>{campaign.milestoneRewardTitle}</strong>.</p></span></div>
      <label className="share-link"><input readOnly value={url} /><button onClick={() => navigator.clipboard.writeText(url)}><Copy /></button></label>
      <button className="share-button" onClick={() => navigator.share?.({ title: campaign.name, url })}><Share2 /> Compartilhar convite</button>
    </section>}
  </main>;
}
