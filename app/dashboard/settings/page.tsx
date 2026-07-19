import Link from "next/link";
import { Bell, KeyRound, Link2, Palette, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { APP_ROUTES } from "@/lib/routes";

const settings = [
  ["Identidade visual", "Configurada individualmente na edição de cada campanha", Palette],
  ["Segurança e acesso", "Gerenciada por sessão Google, papel e vínculo de empresa", ShieldCheck],
  ["Segredos de integração", "Mantidos somente nas variáveis de ambiente do servidor", KeyRound],
  ["Notificações", "Ainda não existe API administrativa para configuração", Bell],
] as const;

export default function SettingsPage() {
  return <><PageHeader eyebrow="CONTA" title="Configurações" description="Visão segura das configurações suportadas atualmente."/><section className="settings-list"><Link className="panel setting-row" href={APP_ROUTES.integrations}><span><Link2/></span><span><strong>Integrações</strong><small>E-mail transacional, CRM e webhooks</small></span><b>→</b></Link>{settings.map(([title,desc,Icon])=><div className="panel setting-row disabled-setting" key={title}><span><Icon/></span><span><strong>{title}</strong><small>{desc}</small></span><b>—</b></div>)}</section></>;
}
