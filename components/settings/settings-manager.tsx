"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, EyeOff, KeyRound, Link2, LockKeyhole, Mail, MessageCircle, Palette, RefreshCw, ShieldCheck, Webhook } from "lucide-react";

import { notificationEventOptions } from "@/modules/settings/schemas";

type Section = "branding" | "integrations" | "security" | "secrets" | "notifications";
type JsonValue = Record<string, unknown>;

async function readResponse(response: Response) {
  const value = await response.json() as JsonValue & { error?: string };
  if (!response.ok) throw new Error(value.error ?? "Não foi possível concluir a operação.");
  return value;
}

export function SettingsManager({ section }: { section: Section }) {
  const [data, setData] = useState<JsonValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await readResponse(await fetch(`/api/admin/settings/${section}`, { cache: "no-store" }))); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as configurações."); }
    finally { setLoading(false); }
  }, [section]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="panel settings-state" aria-live="polite"><RefreshCw className="spin"/> Carregando configurações...</div>;
  if (error) return <div className="panel settings-state error-state"><h2>Não foi possível carregar</h2><p>{error}</p><button className="button secondary" onClick={() => void load()} type="button">Tentar novamente</button></div>;
  if (!data) return null;

  const saved = (next: JsonValue, message = "Configurações salvas com sucesso.") => {
    setData(next); setFeedback(message); window.setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <>
      {section === "branding" && <BrandingForm data={data as unknown as BrandingData} onSaved={saved}/>} 
      {section === "integrations" && <IntegrationsForm data={data as unknown as IntegrationsData} onSaved={saved}/>} 
      {section === "security" && <SecurityView data={data as unknown as SecurityData}/>} 
      {section === "secrets" && <SecretsForm data={data as unknown as SecretsData} onSaved={saved}/>} 
      {section === "notifications" && <NotificationsForm data={data as unknown as NotificationsData} onSaved={saved}/>} 
      {feedback && <div className="email-toast" role="status"><CheckCircle2 size={17}/>{feedback}</div>}
    </>
  );
}

type BrandingData = {
  brandName: string; logoUrl: string; faviconUrl: string; primaryColor: string; secondaryColor: string;
  backgroundColor: string; textColor: string; buttonStyle: "ROUNDED" | "PILL" | "SQUARE";
};

function BrandingForm({ data, onSaved }: { data: BrandingData; onSaved: (value: JsonValue) => void }) {
  const [form, setForm] = useState(data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof BrandingData>(key: K, value: BrandingData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { onSaved(await readResponse(await fetch("/api/admin/settings/branding", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }))); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  };
  const radius = form.buttonStyle === "PILL" ? "999px" : form.buttonStyle === "SQUARE" ? "2px" : "10px";
  return (
    <form className="settings-layout" onSubmit={submit}>
      <section className="form-section settings-form-card">
        <div className="form-section-title"><span><Palette/></span><div><small>MARCA</small><h2>Identidade da empresa</h2><p>URLs de imagens devem usar HTTPS.</p></div></div>
        <div className="form-grid">
          <label className="full">Nome da marca<input required value={form.brandName} onChange={(event) => set("brandName", event.target.value)}/></label>
          <label className="full">URL do logotipo<input type="url" placeholder="https://..." value={form.logoUrl} onChange={(event) => set("logoUrl", event.target.value)}/></label>
          <label className="full">URL do favicon<input type="url" placeholder="https://..." value={form.faviconUrl} onChange={(event) => set("faviconUrl", event.target.value)}/></label>
          {(["primaryColor", "secondaryColor", "backgroundColor", "textColor"] as const).map((key) => (
            <label key={key}>{({ primaryColor: "Cor principal", secondaryColor: "Cor secundária", backgroundColor: "Fundo", textColor: "Texto" })[key]}<span className="settings-color"><input type="color" value={form[key]} onChange={(event) => set(key, event.target.value)}/><input required pattern="#[0-9a-fA-F]{6}" value={form[key]} onChange={(event) => set(key, event.target.value)}/></span></label>
          ))}
          <label className="full">Estilo dos botões<select value={form.buttonStyle} onChange={(event) => set("buttonStyle", event.target.value as BrandingData["buttonStyle"])}><option value="ROUNDED">Arredondado</option><option value="PILL">Pílula</option><option value="SQUARE">Quadrado</option></select></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="settings-actions"><button className="button primary" disabled={saving}>{saving ? "Salvando..." : "Salvar identidade"}</button></div>
      </section>
      <aside className="settings-brand-preview" style={{ background: form.backgroundColor, color: form.textColor }}>
        <small>PRÉVIA AO VIVO</small>
        <div className="settings-preview-logo" style={{ backgroundImage: form.logoUrl ? `url(${form.logoUrl})` : undefined, backgroundColor: form.secondaryColor }}>{!form.logoUrl && form.brandName.slice(0, 1).toUpperCase()}</div>
        <h2>{form.brandName || "Sua marca"}</h2><p>Uma experiência consistente em todos os pontos do loop.</p>
        <button type="button" style={{ background: form.primaryColor, borderRadius: radius }}>Quero participar</button>
      </aside>
    </form>
  );
}

type IntegrationsData = {
  email: { provider: string; senderName: string; senderEmail: string; active: boolean; configured: boolean; credentialSource: string | null };
  whatsapp: { provider: "generic-http"; apiUrl: string; instanceId: string; active: boolean; configured: boolean; credentialSource: string | null };
  webhook: { url: string; active: boolean; events: string[]; configured: boolean };
  crm: { configured: boolean; available: boolean }; automations: Record<string, boolean>;
};

function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) { return <span className={`settings-status ${active ? "active" : ""}`}>{active ? <CheckCircle2/> : <span/>}{children}</span>; }

function IntegrationsForm({ data, onSaved }: { data: IntegrationsData; onSaved: (value: JsonValue) => void }) {
  const [form, setForm] = useState({ email: { senderName: data.email.senderName, senderEmail: data.email.senderEmail, active: data.email.active }, whatsapp: { provider: data.whatsapp.provider, apiUrl: data.whatsapp.apiUrl, instanceId: data.whatsapp.instanceId, active: data.whatsapp.active }, webhook: { url: data.webhook.url, active: data.webhook.active, events: data.webhook.events } });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { onSaved(await readResponse(await fetch("/api/admin/settings/integrations", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }))); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar."); } finally { setSaving(false); } };
  const webhookEvents = [["ParticipantRegistered", "Participante cadastrado"], ["ReferralQualified", "Indicação qualificada"], ["RewardUnlocked", "Recompensa liberada"], ["AutomationFailed", "Falha de automação"]] as const;
  return <form onSubmit={submit} className="settings-stack">
    <section className="panel settings-integration-card"><header><span><Mail/></span><div><h2>Resend</h2><p>Remetente das automações de e-mail.</p></div><StatusPill active={data.email.configured}>{data.email.configured ? "Configurado" : "Incompleto"}</StatusPill></header><div className="form-grid"><label>Nome do remetente<input required value={form.email.senderName} onChange={(e) => setForm({ ...form, email: { ...form.email, senderName: e.target.value } })}/></label><label>E-mail do remetente<input required type="email" value={form.email.senderEmail} onChange={(e) => setForm({ ...form, email: { ...form.email, senderEmail: e.target.value } })}/></label></div><label className="settings-toggle"><input type="checkbox" checked={form.email.active} onChange={(e) => setForm({ ...form, email: { ...form.email, active: e.target.checked } })}/><span>Integração ativa</span></label><p className="field-help">A credencial é gerenciada em Segredos de integração. Fonte atual: {data.email.credentialSource ?? "não configurada"}.</p></section>
    <section className="panel settings-integration-card"><header><span><MessageCircle/></span><div><h2>WhatsApp</h2><p>Adapter HTTP para mensagens transacionais.</p></div><StatusPill active={data.whatsapp.configured}>{data.whatsapp.configured ? "Configurado" : "Incompleto"}</StatusPill></header><div className="form-grid"><label>Adapter<select disabled value="generic-http"><option value="generic-http">Generic HTTP</option></select></label><label>ID da instância<input value={form.whatsapp.instanceId} onChange={(e) => setForm({ ...form, whatsapp: { ...form.whatsapp, instanceId: e.target.value } })}/></label><label className="full">URL HTTPS do provider<input type="url" placeholder="https://gateway.example.com/messages" value={form.whatsapp.apiUrl} onChange={(e) => setForm({ ...form, whatsapp: { ...form.whatsapp, apiUrl: e.target.value } })}/></label></div><label className="settings-toggle"><input type="checkbox" checked={form.whatsapp.active} onChange={(e) => setForm({ ...form, whatsapp: { ...form.whatsapp, active: e.target.checked } })}/><span>Integração ativa</span></label><p className="field-help">O token é gerenciado em Segredos de integração. Fonte atual: {data.whatsapp.credentialSource ?? "não configurada"}.</p></section>
    <section className="panel settings-integration-card"><header><span><Webhook/></span><div><h2>Webhook</h2><p>Endpoint de saída preparado para os eventos de domínio.</p></div><StatusPill active={data.webhook.configured && data.webhook.active}>{data.webhook.configured ? "Configurado" : "Opcional"}</StatusPill></header><label>URL HTTPS<input type="url" placeholder="https://app.exemplo.com/webhooks/growth-loop" value={form.webhook.url} onChange={(e) => setForm({ ...form, webhook: { ...form.webhook, url: e.target.value } })}/></label><div className="settings-check-grid">{webhookEvents.map(([key, label]) => <label className="settings-toggle" key={key}><input type="checkbox" checked={form.webhook.events.includes(key)} onChange={(e) => setForm({ ...form, webhook: { ...form.webhook, events: e.target.checked ? [...form.webhook.events, key] : form.webhook.events.filter((item) => item !== key) } })}/><span>{label}</span></label>)}</div><label className="settings-toggle"><input type="checkbox" checked={form.webhook.active} onChange={(e) => setForm({ ...form, webhook: { ...form.webhook, active: e.target.checked } })}/><span>Endpoint ativo</span></label></section>
    <section className="panel settings-integration-card is-muted"><header><span><Link2/></span><div><h2>CRM</h2><p>Conector ainda não disponível nesta versão.</p></div><StatusPill active={false}>Em breve</StatusPill></header></section>
    <section className="panel settings-automation-summary"><h2>Status das automações</h2><div>{Object.entries(data.automations).map(([key, active]) => <StatusPill active={active} key={key}>{({ email: "E-mail", whatsapp: "WhatsApp", webhook: "Webhook" } as Record<string,string>)[key] ?? key}</StatusPill>)}</div></section>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="settings-actions"><button className="button primary" disabled={saving}>{saving ? "Salvando..." : "Salvar integrações"}</button></div>
  </form>;
}

type SecurityData = { roles: Array<{ role: string; label: string; permissions: string[] }>; session: { strategy: string; provider: string; durationDays: number; currentRole: string; currentUser: string; tenantIdMasked: string }; privacy: Array<{ label: string; active: boolean; note?: string }> };
function SecurityView({ data }: { data: SecurityData }) { return <div className="settings-stack"><section className="panel settings-security"><header><ShieldCheck/><div><h2>Papéis existentes</h2><p>Esta matriz reflete as verificações aplicadas pelo middleware e pelas APIs.</p></div></header><div className="settings-role-grid">{data.roles.map((role) => <article key={role.role}><small>{role.role}</small><h3>{role.label}</h3><ul>{role.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul></article>)}</div></section><section className="panel settings-security"><header><LockKeyhole/><div><h2>Sessão atual</h2><p>Autenticação e contexto efetivamente utilizados.</p></div></header><dl className="settings-definition-list"><div><dt>Provedor</dt><dd>{data.session.provider}</dd></div><div><dt>Estratégia</dt><dd>{data.session.strategy}</dd></div><div><dt>Duração máxima</dt><dd>{data.session.durationDays} dias</dd></div><div><dt>Papel atual</dt><dd>{data.session.currentRole}</dd></div><div><dt>Usuário</dt><dd>{data.session.currentUser}</dd></div><div><dt>Empresa</dt><dd>{data.session.tenantIdMasked}</dd></div></dl></section><section className="panel settings-security"><header><EyeOff/><div><h2>Privacidade e dados</h2><p>Somente controles já implementados são marcados como ativos.</p></div></header><div className="settings-privacy-list">{data.privacy.map((item) => <div key={item.label}><StatusPill active={item.active}>{item.active ? "Ativo" : "Inativo"}</StatusPill><span><strong>{item.label}</strong>{item.note && <small>{item.note}</small>}</span></div>)}</div></section></div>; }

type SecretsData = Record<"resendApiKey" | "whatsappApiToken", { configured: boolean; masked: string | null; source: string | null }>;
function SecretsForm({ data, onSaved }: { data: SecretsData; onSaved: (value: JsonValue, message?: string) => void }) {
  const [values, setValues] = useState({ resendApiKey: "", whatsappApiToken: "" }); const [saving, setSaving] = useState<string | null>(null); const [error, setError] = useState("");
  const save = async (key: keyof SecretsData) => { if (!values[key]) return; setSaving(key); setError(""); try { const next = await readResponse(await fetch("/api/admin/settings/secrets", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, value: values[key] }) })); setValues((current) => ({ ...current, [key]: "" })); onSaved(next, "Credencial atualizada com segurança."); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar."); } finally { setSaving(null); } };
  const rows = [["resendApiKey", "API key do Resend", "re_..."], ["whatsappApiToken", "Token do WhatsApp", "Token de acesso"]] as const;
  return <div className="settings-stack"><div className="panel settings-secret-notice"><LockKeyhole/><div><strong>Valores protegidos</strong><p>As credenciais são criptografadas com AES-256-GCM. O navegador recebe somente uma máscara; deixar o campo vazio preserva o valor atual.</p></div></div>{rows.map(([key, label, placeholder]) => <section className="panel settings-secret-card" key={key}><header><span><KeyRound/></span><div><h2>{label}</h2><p>{data[key].configured ? `${data[key].masked} · fonte ${data[key].source}` : "Ainda não configurado"}</p></div><StatusPill active={data[key].configured}>{data[key].configured ? "Configurado" : "Pendente"}</StatusPill></header><label>Novo valor<input autoComplete="new-password" type="password" placeholder={data[key].configured ? "Deixe vazio para manter o valor atual" : placeholder} value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })}/></label><div className="settings-actions"><button className="button primary" disabled={!values[key] || saving !== null} onClick={() => void save(key)} type="button">{saving === key ? "Salvando..." : "Atualizar credencial"}</button></div></section>)}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}

type NotificationsData = { panelEnabled: boolean; events: string[] };
function NotificationsForm({ data, onSaved }: { data: NotificationsData; onSaved: (value: JsonValue) => void }) {
  const [form, setForm] = useState(data); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { onSaved(await readResponse(await fetch("/api/admin/settings/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }))); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar."); } finally { setSaving(false); } };
  return <form className="settings-stack" onSubmit={submit}><section className="panel settings-notification-channel"><header><span><CheckCircle2/></span><div><h2>Painel administrativo</h2><p>Canal disponível para usuários vinculados à empresa.</p></div><StatusPill active={form.panelEnabled}>{form.panelEnabled ? "Ativo" : "Inativo"}</StatusPill></header><label className="settings-toggle"><input type="checkbox" checked={form.panelEnabled} onChange={(event) => setForm({ ...form, panelEnabled: event.target.checked })}/><span>Gerar notificações no painel</span></label></section><div className="settings-channel-grid"><section className="panel is-muted"><Mail/><h3>E-mail administrativo</h3><p>Canal não implementado para alertas administrativos.</p><StatusPill active={false}>Indisponível</StatusPill></section><section className="panel is-muted"><MessageCircle/><h3>WhatsApp administrativo</h3><p>Canal não implementado para alertas administrativos.</p><StatusPill active={false}>Indisponível</StatusPill></section></div><section className="panel settings-events"><h2>Eventos do painel</h2><p>Os eventos abaixo possuem emissores no fluxo atual.</p>{notificationEventOptions.map((option) => <label className="settings-toggle" key={option.key}><input type="checkbox" disabled={!form.panelEnabled} checked={form.events.includes(option.key)} onChange={(event) => setForm({ ...form, events: event.target.checked ? [...form.events, option.key] : form.events.filter((item) => item !== option.key) })}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</section>{error && <p className="form-error" role="alert">{error}</p>}<div className="settings-actions"><button className="button primary" disabled={saving}>{saving ? "Salvando..." : "Salvar notificações"}</button></div></form>;
}
