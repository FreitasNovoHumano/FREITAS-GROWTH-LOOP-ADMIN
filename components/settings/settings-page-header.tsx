import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";

export function SettingsPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <>
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        <Link href="/dashboard/settings">Configurações</Link><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">{title}</span>
      </nav>
      <PageHeader eyebrow="CONFIGURAÇÕES" title={title} description={description}/>
    </>
  );
}

