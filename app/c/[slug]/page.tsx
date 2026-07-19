import { CampaignRegistration } from "@/components/public/campaign-registration";

type CampaignPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invited_by_lead_slug?: string | string[] }>;
};

export default async function CampaignPage({ params, searchParams }: CampaignPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const invitedByLeadSlug = typeof query.invited_by_lead_slug === "string"
    ? query.invited_by_lead_slug
    : undefined;

  return <CampaignRegistration slug={slug} invitedByLeadSlug={invitedByLeadSlug} />;
}
