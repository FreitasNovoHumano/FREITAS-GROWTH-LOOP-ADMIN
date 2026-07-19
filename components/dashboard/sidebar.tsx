"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, Gift, LayoutDashboard, LogOut, Mail, Settings, ShieldAlert, Target, Users, UserRoundPlus } from "lucide-react";
import { productionAppUrl } from "@/lib/app-url";

const links = [
  ["Visão geral", "/dashboard", LayoutDashboard], ["Campanhas", "/dashboard/campaigns", Target],
  ["Leads", "/dashboard/leads", UserRoundPlus], ["Participantes", "/dashboard/participants", Users],
  ["Recompensas", "/dashboard/rewards", Gift], ["Relatórios", "/dashboard/reports", BarChart3],
  ["E-mails", "/dashboard/emails", Mail], ["Antifraude", "/dashboard/fraud", ShieldAlert],
  ["Configurações", "/dashboard/settings", Settings],
] as const;

export function Sidebar() {
  const path = usePathname(); const { data } = useSession();
  return <aside className="sidebar"><div className="brand side-brand"><span className="brand-mark"><Image src="/freitas-loop.png" alt="Freitas Growth Loop" width={38} height={38} priority/></span><span>Growth <b>Loop</b></span></div><div className="workspace"><span className="workspace-avatar">FG</span><span><small>EMPRESA</small><strong>Freitas Growth AI</strong></span></div><nav>{links.map(([label, href, Icon]) => <Link className={path === href ? "active" : ""} href={productionAppUrl(href)} key={href}><Icon size={19}/>{label}</Link>)}</nav><div className="side-user"><span className="avatar">{data?.user?.name?.[0] ?? "U"}</span><span><strong>{data?.user?.name ?? "Usuário"}</strong><small>{data?.user?.email}</small></span><button aria-label="Sair" onClick={() => signOut({ callbackUrl: productionAppUrl("/login") })}><LogOut size={18}/></button></div></aside>;
}
