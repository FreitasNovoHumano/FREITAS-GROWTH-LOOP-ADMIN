import { z } from "zod";

export const publicCampaignClientIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i);

type ActiveCampaignRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  status: string;
  clientId: string;
  page: { heroImageUrl: string | null } | null;
};

export function activeCampaignWhere(clientId: string) {
  return { clientId, status: "ACTIVE" as const };
}

export function publicCampaignWhere(slug: string, clientId?: string) {
  return {
    slug,
    status: "ACTIVE" as const,
    ...(clientId ? { clientId } : {}),
  };
}

export function serializePublicCampaign(
  campaign: ActiveCampaignRecord,
  requestUrl: string,
) {
  const publicUrl = new URL(`/growth-loop/${campaign.slug}`, requestUrl);
  publicUrl.searchParams.set("clientId", campaign.clientId);

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    image: campaign.page?.heroImageUrl ?? campaign.logoUrl,
    status: "ACTIVE" as const,
    publicUrl: publicUrl.toString(),
  };
}
