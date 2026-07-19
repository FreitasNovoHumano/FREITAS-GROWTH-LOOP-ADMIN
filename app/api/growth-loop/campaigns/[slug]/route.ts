import { handleGetCampaign } from "@/modules/growth-loop/http/public-campaign-handlers";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handleGetCampaign(request, slug);
}
