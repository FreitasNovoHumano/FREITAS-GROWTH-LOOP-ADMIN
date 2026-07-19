import { Mail, Variable } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const templates = [
  { title: "Primeira recompensa", keys: "FIRST_REWARD / INITIAL_REWARD", trigger: "Cadastro concluído", variables: "participantName, campaignName, rewardTitle, rewardValue, rewardUrl, inviteUrl, qualifiedReferralGoal, secondRewardTitle" },
  { title: "Segunda recompensa", keys: "SECOND_REWARD / MILESTONE_REWARD", trigger: "Meta de indicações qualificadas", variables: "participantName, campaignName, rewardTitle, rewardValue, rewardUrl, qualifiedReferralGoal" },
] as const;

export default function EmailsPage() {
  return <>
    <PageHeader eyebrow="AUTOMAÇÕES" title="E-mails" description="Templates reconhecidos atualmente pelo fluxo transacional."/>
    <div className="notice-card" role="note"><Mail/><div><strong>Envio ativo pelo transporte SMTP do servidor</strong><p>A edição e o envio de teste pelo painel dependem de uma API administrativa que ainda não existe. Nenhuma credencial é exposta nesta tela.</p></div></div>
    <section className="template-grid email-template-grid">{templates.map((template) => <article className="panel template-card" key={template.title}><span className="template-icon"><Mail/></span><h2>{template.title}</h2><p>{template.trigger}</p><small>CHAVES SUPORTADAS</small><strong>{template.keys}</strong><span className="template-vars"><Variable size={15}/>{template.variables}</span><button disabled title="Disponível após integração da API de templates">Editar template · indisponível</button></article>)}</section>
  </>;
}
