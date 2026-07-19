import { CheckCircle2, Mail, ShieldCheck, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export default function IntegrationsPage() {
  const configured = Boolean(process.env.SMTP_HOST?.trim());
  const sender = process.env.EMAIL_FROM?.trim() || "Não configurado";
  return <>
    <PageHeader eyebrow="CONEXÕES" title="Integrações" description="Estado das integrações efetivamente utilizadas pelo Growth Loop."/>
    <section className="integration-grid">
      <article className="panel integration-card"><span className="template-icon"><Mail/></span><div><small>TRANSPORTE DE E-MAIL</small><h2>SMTP</h2><p>Configuração global protegida pelas variáveis de ambiente do servidor.</p></div><span className={`integration-status ${configured ? "connected" : "disconnected"}`}>{configured ? <CheckCircle2/> : <XCircle/>}{configured ? "Configurado" : "Não configurado"}</span><dl><div><dt>Remetente</dt><dd>{sender}</dd></div><div><dt>Credenciais</dt><dd>Protegidas no servidor</dd></div><div><dt>Escopo</dt><dd>Global da aplicação</dd></div></dl></article>
      <article className="panel integration-card muted-integration"><span className="template-icon"><ShieldCheck/></span><div><small>OUTRAS INTEGRAÇÕES</small><h2>CRM e webhooks</h2><p>Os modelos existem no banco, mas ainda não há serviços ou endpoints operacionais.</p></div><span className="integration-status disconnected"><XCircle/>Indisponível</span></article>
    </section>
  </>;
}
