"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Pencil, Send, X } from "lucide-react";

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

const emptyProvider: Provider = {
  provider: "Resend",
  configured: false,
  senderName: "",
  senderEmail: "",
  credentialConfigured: false,
  credentialSource: null,
};

export function EmailAutomationManager() {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
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
        action={<button className="button primary" type="button" onClick={() => setProviderOpen(true)}><Send size={17} /> Configurar provedor</button>}
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

      {providerOpen && (
        <ProviderDialog
          provider={data?.provider ?? emptyProvider}
          whatsappProvider={data?.whatsappProvider ?? { provider: null, configured: false, apiUrl: "", instanceId: "", credentialConfigured: false, credentialSource: null }}
          onClose={() => setProviderOpen(false)}
          onSaved={(provider, whatsappProvider) => {
            setData((current) => current ? { ...current, provider, whatsappProvider } : current);
            setProviderOpen(false);
            notify("Configuração do provedor salva com sucesso.");
          }}
        />
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

function ProviderDialog({ provider, whatsappProvider, onClose, onSaved }: {
  provider: Provider; whatsappProvider: WhatsAppProvider; onClose: () => void; onSaved: (provider: Provider, whatsappProvider: WhatsAppProvider) => void;
}) {
  const [form, setForm] = useState({ senderName: provider.senderName, senderEmail: provider.senderEmail, apiKey: "" });
  const [whatsappForm, setWhatsAppForm] = useState({ provider: "generic-http", apiUrl: whatsappProvider.apiUrl, apiToken: "", instanceId: whatsappProvider.instanceId });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [testNumbers, setTestNumbers] = useState("");
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testFeedback, setTestFeedback] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/emails/provider", {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form),
      });
      const value = await response.json() as Provider & { error?: string };
      if (!response.ok) throw new Error(value.error ?? "Não foi possível salvar o provedor.");
      let savedWhatsApp = whatsappProvider;
      if (whatsappProvider.configured || whatsappForm.apiUrl || whatsappForm.apiToken) {
        const whatsappResponse = await fetch("/api/admin/emails/whatsapp/provider", {
          method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(whatsappForm),
        });
        const whatsappValue = await whatsappResponse.json() as WhatsAppProvider & { error?: string };
        if (!whatsappResponse.ok) throw new Error(whatsappValue.error ?? "Não foi possível salvar o provider de WhatsApp.");
        savedWhatsApp = whatsappValue;
      }
      onSaved(value, savedWhatsApp);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o provedor.");
    } finally { setSaving(false); }
  };
  const testWhatsApp = async () => {
    setTestingWhatsApp(true); setError(""); setTestFeedback("");
    try {
      const response = await fetch("/api/admin/emails/whatsapp/test", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ numbers: testNumbers, message: "Teste de configuração do Freitas Growth Loop." }),
      });
      const value = await response.json() as { results?: Array<{ status: "sent" | "failed" }>; error?: string };
      if (!response.ok) throw new Error(value.error ?? "Não foi possível testar o WhatsApp.");
      const sent = value.results?.filter((result) => result.status === "sent").length ?? 0;
      const failed = value.results?.filter((result) => result.status === "failed").length ?? 0;
      setTestFeedback(`${sent} enviado(s)${failed ? ` · ${failed} falha(s)` : ""}.`);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Não foi possível testar o WhatsApp.");
    } finally { setTestingWhatsApp(false); }
  };
  return (
    <DialogShell title="Configurar provedores" description="Configuração independente dos canais da automação." onClose={onClose}>
      <form onSubmit={submit} className="email-form">
        <section className="channel-form-section"><div className="channel-form-title"><Mail /><div><strong>E-mail</strong><small>Resend</small></div></div><div className="form-grid">
            <label>Nome do remetente<input required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} /></label>
            <label>E-mail do remetente<input required type="email" value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} /></label>
            <label className="full">API key do Resend
              <input type="password" autoComplete="new-password" value={form.apiKey} placeholder={provider.credentialConfigured ? "•••••••••••• (manter atual)" : "re_..."} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
              <span className="field-help">Deixe vazio para manter a credencial atual{provider.credentialSource === "environment" ? " definida no ambiente" : ""}.</span>
            </label>
        </div></section>
        <section className="channel-form-section"><div className="channel-form-title"><MessageCircle /><div><strong>WhatsApp</strong><small>{whatsappProvider.configured ? `${whatsappProvider.provider} configurado` : "Não configurado"}</small></div></div><p className="provider-env-help">A configuração é criptografada por empresa. As variáveis <code>WHATSAPP_*</code> podem ser usadas como fallback do servidor.</p><div className="form-grid"><label>Adapter<select value={whatsappForm.provider} onChange={(event) => setWhatsAppForm({ ...whatsappForm, provider: event.target.value })}><option value="generic-http">Generic HTTP</option></select></label><label>ID da instância <span className="field-help">opcional</span><input value={whatsappForm.instanceId} onChange={(event) => setWhatsAppForm({ ...whatsappForm, instanceId: event.target.value })} /></label><label className="full">URL HTTPS do provider<input type="url" value={whatsappForm.apiUrl} onChange={(event) => setWhatsAppForm({ ...whatsappForm, apiUrl: event.target.value })} placeholder="https://gateway.example.com/messages" /></label><label className="full">Token do provider<input type="password" autoComplete="new-password" value={whatsappForm.apiToken} onChange={(event) => setWhatsAppForm({ ...whatsappForm, apiToken: event.target.value })} placeholder={whatsappProvider.credentialConfigured ? "•••••••••••• (manter atual)" : "Token de acesso"} /><span className="field-help">Deixe vazio para manter a credencial atual. O token nunca retorna ao navegador.</span></label></div><label>Número(s) para teste<input value={testNumbers} onChange={(event) => setTestNumbers(event.target.value)} placeholder="5511999999999, 5521988888888" /><span className="field-help">Para vários números, separe por vírgula ou ponto e vírgula.</span></label><div className="provider-test-row"><button className="button secondary" type="button" disabled={!whatsappProvider.configured || testingWhatsApp || !testNumbers.trim()} onClick={() => void testWhatsApp()}>{testingWhatsApp ? "Enviando..." : "Enviar teste"}</button>{testFeedback && <span className="provider-test-feedback"><CheckCircle2 size={15} />{testFeedback}</span>}</div></section>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer><button className="button secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar configuração"}</button></footer>
      </form>
    </DialogShell>
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
