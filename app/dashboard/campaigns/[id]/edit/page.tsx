import { CampaignEditForm } from "@/components/campaigns/campaign-edit-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><PageHeader eyebrow="CONFIGURAÇÃO" title="Editar campanha" description="Atualize os campos suportados pelo backend atual."/><CampaignEditForm id={id}/></>;
}
