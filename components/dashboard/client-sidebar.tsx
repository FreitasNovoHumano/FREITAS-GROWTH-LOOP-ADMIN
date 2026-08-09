"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  Orbit,
  Target,
  Users,
} from "lucide-react";

import { CLIENT_DASHBOARD_ROUTES } from "@/lib/client-area";

const clientLinks = [
  ["Visão geral", CLIENT_DASHBOARD_ROUTES[0], LayoutDashboard],
  ["Minha campanha", CLIENT_DASHBOARD_ROUTES[1], Target],
  ["Participantes", CLIENT_DASHBOARD_ROUTES[2], Users],
  ["Recompensas", CLIENT_DASHBOARD_ROUTES[3], Gift],
  ["Relatórios", CLIENT_DASHBOARD_ROUTES[4], BarChart3],
] as const;

export function ClientSidebar({
  publicCampaignHref,
  user,
}: {
  publicCampaignHref?: string;
  user: { name: string; email: string };
}) {
  const path = usePathname();

  return (
    <aside className="sidebar" data-dashboard-role="client">
      <Brand />
      <div className="workspace">
        <span className="workspace-avatar">{user.name[0] ?? "C"}</span>
        <span>
          <small>DASHBOARD DO CLIENTE</small>
          <strong>Sua empresa</strong>
        </span>
      </div>
      <nav aria-label="Navegação do cliente Growth Loop">
        {clientLinks.map(([label, href, Icon]) => (
          <NavigationLink
            active={href === "/dashboard" ? path === href : path === href || path.startsWith(`${href}/`)}
            href={href}
            icon={Icon}
            key={href}
            label={label}
          />
        ))}
        {publicCampaignHref && (
          <Link href={publicCampaignHref} target="_blank">
            <ExternalLink size={19} aria-hidden="true" />
            Página pública
          </Link>
        )}
      </nav>
      <Account user={user} />
    </aside>
  );
}

function Brand() {
  return (
    <div className="brand side-brand">
      <span className="brand-mark"><Orbit aria-hidden="true" /></span>
      <span>Growth <b>Loop</b></span>
    </div>
  );
}

function NavigationLink({ active, href, icon: Icon, label }: {
  active: boolean;
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link aria-current={active ? "page" : undefined} className={active ? "active" : ""} href={href}>
      <Icon size={19} aria-hidden="true" />
      {label}
    </Link>
  );
}

function Account({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="side-user">
      <span className="avatar">{user.name[0] ?? "C"}</span>
      <span><strong>{user.name}</strong><small>Cliente · {user.email}</small></span>
      <button aria-label="Sair" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
