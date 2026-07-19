import Link from "next/link";
import { Info, Send, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { APP_ROUTES } from "@/lib/routes";

export default function InvitationsPage() {
  return <>
    <PageHeader eyebrow="INDICAÇÕES" title="Convites" description="Acompanhamento dos convites e cadastros atribuídos."/>
    <div className="notice-card" role="note"><Info/><div><strong>Rastreamento detalhado ainda indisponível</strong><p>O fluxo público atual atribui cadastros pelo parâmetro <code>invited_by_lead_slug</code>, mas não cria registros de Invitation ao compartilhar um link. Por isso não é possível listar com precisão envios, aberturas ou pendências.</p></div></div>
    <section className="insight-grid">
      <article className="panel"><span className="template-icon"><Users/></span><h2>Indicações qualificadas</h2><p>Uma indicação é considerada qualificada quando o convidado foi atribuído a outro lead e acessou a primeira recompensa.</p><Link className="button secondary" href={APP_ROUTES.reports}>Ver total consolidado</Link></article>
      <article className="panel"><span className="template-icon"><Send/></span><h2>Envio individual por e-mail</h2><p>O modelo de dados existe, mas faltam endpoint, serviço de envio, idempotência e rastreamento de aceite. A interface de envio não foi habilitada para evitar uma ação falsa.</p><button className="button secondary" disabled title="Disponível após implementação do backend">Disponível após integração</button></article>
    </section>
  </>;
}
