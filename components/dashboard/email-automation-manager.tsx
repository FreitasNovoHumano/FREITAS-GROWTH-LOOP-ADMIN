"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Pencil, Send, X } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";

type Template = {
  key: string;
  name: string;
  description: string;
  trigger: string;
  subject: string;
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
  supportsWhatsApp: boolean;
  whatsappEnabled: boolean;
  whatsappMessage: string;
  variables: string[];
};

type Provider = {
  provider: string;
  configured: boolean;
  senderName: string;
  senderEmail: string;
  credentialConfigured: boolean;
  credentialSource: "integration" | "environment" | null;
};

type WhatsAppProvider = {
  provider: string | null;
  configured: boolean;
  apiUrl: string;
  instanceId: string;
  credentialConfigured: boolean;
  credentialSource: "integration" | "environment" | null;
};
type EmailData = { provider: Provider; whatsappProvider: WhatsAppProvider; templates: Template[] };

export function EmailAutomationManager() {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/emails", { cache: "no-store" });
      const value = await response.json() as EmailData & { error?: string };
      if (!response.ok) throw new Error(value.error ?? "Não foi possível carregar os e-mails.");
      setData(value);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os e-mails.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeTemplate = data?.templates.find((template) => template.key === templateKey) ?? null;
  const notify = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <>
      <PageHeader
        eyebrow="AUTOMAÇÕES"
        title="E-mails"
        description="Mensagens consistentes em cada momento do loop."
        action={<Link className="button primary" href="/dashboard/settings/integrations"><Send size={17} /> Configurar provedor</Link>}
      />

      {loading && <div className="empty email-state">Carregando configurações de e-mail...</div>}
      {!loading && error && (
        <div className="empty email-state">
          <h3>Não foi possível carregar a página</h3><p>{error}</p>
          <button className="button secondary" type="button" onClick={() => void load()}>Tentar novamente</button>
        </div>
      )}
      {!loading && data && (
        <>
          <div className="email-provider-grid">
            <div className={`email-provider-status ${data.provider.configured ? "is-configured" : ""}`}>
              <span>{data.provider.configured ? <CheckCircle2 size={16} /> : <Mail size={16} />}</span>
              <div><strong>E-mail · Resend</strong><small>{data.provider.configured ? `Configurado para ${data.provider.senderEmail}` : "Não configurado"}</small></div>
            </div>
            <div className={`email-provider-status ${data.whatsappProvider.configured ? "is-configured" : ""}`}>
              <span>{data.whatsappProvider.configured ? <CheckCircle2 size={16} /> : <MessageCircle size={16} />}</span>
              <div><strong>WhatsApp</strong><small>{data.whatsappProvider.configured ? `${data.whatsappProvider.provider} configurado` : "Não configurado"}</small></div>
            </div>
          </div>
          <section className="template-grid">
            {data.templates.map((template) => (
              <article className="panel template-card" key={template.key}>
                <span className="template-icon"><Mail aria-hidden="true" /></span>
                <h2>{template.name}</h2>
                <p>{template.description}</p>
                <small>GATILHO</small>
                <strong>{template.trigger}</strong>
                <div className="template-channels" aria-label="Canais habilitados">
                  <small>CANAIS</small>
                  <span className={template.active ? "is-enabled" : ""}><Mail size={13} /> E-mail</span>
                  {template.supportsWhatsApp && <span className={template.whatsappEnabled ? "is-enabled" : ""}><MessageCircle size={13} /> WhatsApp</span>}
                </div>
                <button type="button" onClick={() => setTemplateKey(template.key)}>
                  <Pencil size={16} /> Editar template
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      {activeTemplate && (
        <TemplateDialog
          template={activeTemplate}
          onClose={() => setTemplateKey(null)}
          onSaved={(template) => {
            setData((current) => current ? {
              ...current,
              templates: current.templates.map((item) => item.key === template.key ? { ...item, ...template } : item),
            } : current);
            setTemplateKey(null);
            notify("Template salvo com sucesso.");
          }}
        />
      )}
      {feedback && <div className="email-toast" role="status"><CheckCircle2 size={17} />{feedback}</div>}
    </>
  );
}

function DialogShell({ title, description, onClose, children }: {
  title: string; description: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="email-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="email-dialog" role="dialog" aria-modal="true" aria-labelledby="email-dialog-title">
        <header>
          <div><h2 id="email-dialog-title">{title}</h2><p>{description}</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar"><X /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function TemplateDialog({ template, onClose, onSaved }: {
  template: Template; onClose: () => void; onSaved: (template: Template) => void;
}) {
  const [form, setForm] = useState(template);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/emails/templates/${template.key}`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({
          subject: form.subject, title: form.title, body: form.body, buttonText: form.buttonText,
          buttonUrl: form.buttonUrl, active: form.active, whatsappEnabled: form.whatsappEnabled,
          whatsappMessage: form.whatsappMessage,
        }),
      });
      const value = await response.json() as Partial<Template> & { error?: string };
      if (!response.ok) throw new Error(value.error ?? "Não foi possível salvar o template.");
      onSaved({ ...template, ...value });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o template.");
    } finally { setSaving(false); }
  };
  return (
    <DialogShell title={template.name} description={`Gatilho: ${template.trigger}`} onClose={onClose}>
      <form onSubmit={submit} className="email-form">
        <div className="email-template-fields">
          <section className="channel-form-section"><div className="channel-form-title"><Mail /><div><strong>E-mail</strong><small>Conteúdo enviado pelo Resend</small></div></div><div className="email-template-fields">
            <label>Assunto<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label>Título<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Corpo da mensagem<textarea required rows={7} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
            <div className="form-grid"><label>Texto do botão<input value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} /></label><label>Link ou destino<input value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} /></label></div>
            <label className="email-toggle"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Enviar por e-mail</label>
          </div></section>
          {template.supportsWhatsApp && <section className="channel-form-section"><div className="channel-form-title"><MessageCircle /><div><strong>WhatsApp</strong><small>Mensagem independente do e-mail</small></div></div><div className="email-template-fields">
            <label className="email-toggle"><input type="checkbox" checked={form.whatsappEnabled} onChange={(e) => setForm({ ...form, whatsappEnabled: e.target.checked })} />Enviar por WhatsApp</label>
            <label>Mensagem do WhatsApp<textarea required={form.whatsappEnabled} rows={8} value={form.whatsappMessage} onChange={(e) => setForm({ ...form, whatsappMessage: e.target.value })} /></label>
            <span className="field-help">O destinatário usa o telefone já cadastrado. Para vários números em integrações manuais, separe por vírgula ou ponto e vírgula.</span>
          </div></section>}
          <div className="email-variables"><small>VARIÁVEIS DISPONÍVEIS</small><div>{template.variables.map((variable) => <code key={variable}>{`{{${variable}}}`}</code>)}</div></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer><button className="button secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar template"}</button></footer>
      </form>
    </DialogShell>
  );
}
