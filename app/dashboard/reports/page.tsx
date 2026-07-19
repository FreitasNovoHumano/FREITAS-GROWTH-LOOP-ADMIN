import { PageHeader } from "@/components/dashboard/page-header";
import { ReportsOverview } from "@/components/dashboard/admin-overview";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="INTELIGÊNCIA"
        title="Relatórios"
        description="Consulte os indicadores que já são calculados pelo backend, sem estimativas."
      />
      <ReportsOverview />
    </>
  );
}
