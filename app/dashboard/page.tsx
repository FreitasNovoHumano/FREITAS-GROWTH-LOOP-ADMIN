import Link from "next/link";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardOverview } from "@/components/dashboard/admin-overview";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="PAINEL DE CRESCIMENTO"
        title="Visão geral do Growth Loop"
        description="Acompanhe os dados consolidados e confirmados das suas campanhas."
        action={<Link href="/dashboard/campaigns/new" className="button primary"><Target size={18} /> Nova campanha</Link>}
      />
      <DashboardOverview />
    </>
  );
}
