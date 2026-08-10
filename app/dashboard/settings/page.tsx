import { Bell, KeyRound, Link2, Palette, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdministrator } from "@/lib/authorization";

const settings = [
  ["Identidade visual", "Cores, logotipo e experiência pública", Palette, "/dashboard/settings/branding"],
  ["Integrações", "E-mail, WhatsApp, webhooks e automações", Link2, "/dashboard/settings/integrations"],
  ["Segurança e acesso", "Permissões, sessão e proteção de dados", ShieldCheck, "/dashboard/settings/security"],
  ["Segredos de integração", "Credenciais armazenadas com criptografia", KeyRound, "/dashboard/settings/secrets"],
  ["Notificações", "Alertas de campanhas e falhas de entregas", Bell, "/dashboard/settings/notifications"],
] as const;

export default async function Page() {
  await requireAdministrator();
  return <><PageHeader eyebrow="CONTA" title="Configurações" description="Controle a operação do Growth Loop para sua empresa."/><section className="settings-list">{settings.map(([title,desc,Icon,href])=><Link className="panel setting-row" href={href} key={title}><span><Icon aria-hidden="true"/></span><span><strong>{title}</strong><small>{desc}</small></span><b aria-hidden="true">→</b></Link>)}</section></>;
}
