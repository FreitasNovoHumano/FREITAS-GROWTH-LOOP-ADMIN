import { CampaignDetails } from "@/components/campaigns/campaign-details";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetails id={id} />;
}
