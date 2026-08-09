"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Gift,
  LayoutDashboard,
  LogOut,
  Mail,
  Orbit,
  Settings,
  ShieldAlert,
  Target,
  UserRoundPlus,
  Users,
} from "lucide-react";

const adminLinks = [
  ["Visão geral", "/dashboard", LayoutDashboard],
  ["Campanhas", "/dashboard/campaigns", Target],
  ["Leads", "/dashboard/leads", UserRoundPlus],
  ["Participantes", "/dashboard/participants", Users],
  ["Recompensas", "/dashboard/rewards", Gift],
  ["Relatórios", "/dashboard/reports", BarChart3],
  ["E-mails", "/dashboard/emails", Mail],
  ["Antifraude", "/dashboard/fraud", ShieldAlert],
  ["Configurações", "/dashboard/settings", Settings],
] as const;

export function AdminSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const path = usePathname();

  return (
    <aside className="sidebar" data-dashboard-role="admin">
      <div className="brand side-brand">
        <span className="brand-mark"><Orbit aria-hidden="true" /></span>
        <span>Growth <b>Loop</b></span>
      </div>
      <div className="workspace">
        <span className="workspace-avatar">{user.name[0] ?? "A"}</span>
        <span><small>PAINEL ADMINISTRATIVO</small><strong>Acesso multiempresa</strong></span>
      </div>
      <nav aria-label="Navegação administrativa do Growth Loop">
        {adminLinks.map(([label, href, Icon]) => {
          const active = href === "/dashboard" ? path === href : path === href || path.startsWith(`${href}/`);
          return (
            <Link aria-current={active ? "page" : undefined} className={active ? "active" : ""} href={href} key={href}>
              <Icon size={19} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="side-user">
        <span className="avatar">{user.name[0] ?? "A"}</span>
        <span><strong>{user.name}</strong><small>Administrador · {user.email}</small></span>
        <button aria-label="Sair" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
