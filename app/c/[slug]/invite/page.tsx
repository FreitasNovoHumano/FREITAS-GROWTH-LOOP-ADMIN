import { CampaignInvite } from "@/components/public/campaign-invite";

type CampaignInvitePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead_slug?: string | string[] }>;
};

export default async function CampaignInvitePage({ params, searchParams }: CampaignInvitePageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const leadSlug = typeof query.lead_slug === "string" ? query.lead_slug : undefined;

  return <CampaignInvite campaignSlug={slug} leadSlug={leadSlug} />;
}
