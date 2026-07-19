import { handleRegisterCampaign } from "@/modules/growth-loop/http/public-campaign-handlers";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handleRegisterCampaign(request, slug);
}
