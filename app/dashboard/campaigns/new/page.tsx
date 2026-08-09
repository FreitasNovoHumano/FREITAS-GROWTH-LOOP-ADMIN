import { CampaignForm } from "@/components/campaigns/campaign-form";
import { requireAdministrator } from "@/lib/authorization";

export default async function NewCampaignPage() {
  await requireAdministrator();
  return <CampaignForm />;
}
