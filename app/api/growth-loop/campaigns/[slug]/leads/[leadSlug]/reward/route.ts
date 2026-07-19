import { handleClaimCampaignReward } from "@/modules/growth-loop/http/public-campaign-handlers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; leadSlug: string }> },
) {
  const { slug, leadSlug } = await params;
  return handleClaimCampaignReward(request, slug, leadSlug);
}
