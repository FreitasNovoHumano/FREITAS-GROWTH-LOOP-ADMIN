import { CampaignForm } from "@/components/campaigns/campaign-form";
import { requireAdministrator } from "@/lib/authorization";

export default async function NewCampaignPage() {
  await requireAdministrator();
  const configuredOrigin =
    process.env.GROWTH_LOOP_NEXTAUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:3001";
  return <CampaignForm publicOrigin={new URL(configuredOrigin).origin} />;
}
