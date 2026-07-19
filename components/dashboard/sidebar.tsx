"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BarChart3, Gift, LayoutDashboard, LogOut, Mail, PlugZap, Send, Settings, ShieldAlert, Target, UserRoundPlus, Users } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

const links = [
  ["Visão geral", APP_ROUTES.dashboard, LayoutDashboard],
  ["Campanhas", APP_ROUTES.campaigns, Target],
  ["Leads", APP_ROUTES.leads, UserRoundPlus],
  ["Participantes", APP_ROUTES.participants, Users],
  ["Convites", APP_ROUTES.invitations, Send],
  ["Recompensas", APP_ROUTES.rewards, Gift],
  ["Relatórios", APP_ROUTES.reports, BarChart3],
  ["E-mails", APP_ROUTES.emails, Mail],
  ["Integrações", APP_ROUTES.integrations, PlugZap],
  ["Antifraude", APP_ROUTES.fraud, ShieldAlert],
  ["Configurações", APP_ROUTES.settings, Settings],
] as const;

export function Sidebar() {
  const path = usePathname();
  const { data } = useSession();
  return <aside className="sidebar">
    <div className="brand side-brand"><span className="brand-mark"><Image src="/freitas-loop.png" alt="Freitas Growth Loop" width={38} height={38} priority/></span><span>Growth <b>Loop</b></span></div>
    <div className="workspace"><span className="workspace-avatar">FG</span><span><small>EMPRESA</small><strong>Freitas Growth AI</strong></span></div>
    <nav>{links.map(([label, href, Icon]) => {
      const active = path === href || (href !== APP_ROUTES.dashboard && path.startsWith(`${href}/`));
      return <Link className={active ? "active" : ""} href={href} key={href}><Icon size={19}/>{label}</Link>;
    })}</nav>
    <div className="side-user"><span className="avatar">{data?.user?.name?.[0] ?? "U"}</span><span><strong>{data?.user?.name ?? "Usuário"}</strong><small>{data?.user?.email}</small></span><button aria-label="Sair" title="Sair" onClick={() => signOut({ callbackUrl: APP_ROUTES.login })}><LogOut size={18}/></button></div>
  </aside>;
}
