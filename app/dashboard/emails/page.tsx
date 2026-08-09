import { Mail, Pencil, Send } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdministrator } from "@/lib/authorization";

const templates = [
  ["Boas-vindas e recompensa inicial", "Enviado após o cadastro", "Participante cadastrado"],
  ["Convite de indicação", "Enviado ao amigo convidado", "Convite criado"],
  ["Progresso do participante", "Celebra cada indicação qualificada", "Indicação qualificada"],
  ["Recompensa desbloqueada", "Confirma o marco de três indicações", "Meta atingida"],
];

export default async function Page() {
  await requireAdministrator();

  return <><PageHeader eyebrow="AUTOMAÇÕES" title="E-mails" description="Mensagens consistentes em cada momento do loop." action={<button className="button primary"><Send size={17}/> Configurar provedor</button>}/><section className="template-grid">{templates.map(([title,desc,event])=><article className="panel template-card" key={title}><span className="template-icon"><Mail/></span><h2>{title}</h2><p>{desc}</p><small>GATILHO</small><strong>{event}</strong><button><Pencil size={16}/> Editar template</button></article>)}</section></>;
}
