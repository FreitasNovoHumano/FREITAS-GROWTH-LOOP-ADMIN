import { handleClaimCampaignReward } from "@/modules/growth-loop/http/public-campaign-handlers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignSlug: string; leadSlug: string }> },
) {
  const { campaignSlug, leadSlug } = await params;
  return handleClaimCampaignReward(request, campaignSlug, leadSlug);
}
