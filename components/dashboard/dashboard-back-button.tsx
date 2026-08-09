"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardBackButton() {
  const pathname = usePathname();

  if (pathname === "/dashboard") return null;

  return (
    <Link
      aria-label="Voltar para o dashboard principal"
      className="dashboard-back-button"
      href="/dashboard"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      Voltar
    </Link>
  );
}
