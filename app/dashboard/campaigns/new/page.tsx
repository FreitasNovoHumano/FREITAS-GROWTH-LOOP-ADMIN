import { CampaignForm } from "@/components/campaigns/campaign-form";
import { requireAdminTenant, requireAdministrator } from "@/lib/authorization";

export default async function NewCampaignPage() {
  await requireAdministrator();
  const clientId = await requireAdminTenant().then((tenant) => tenant.clientId).catch(() => undefined);
  const configuredOrigin =
    process.env.GROWTH_LOOP_NEXTAUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "https://freitas-growth-loop-admin.vercel.app";
  return <CampaignForm publicOrigin={new URL(configuredOrigin).origin} clientId={clientId} />;
}
