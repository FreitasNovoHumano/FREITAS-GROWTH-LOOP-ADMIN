import { SettingsManager } from "@/components/settings/settings-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><SettingsPageHeader title="Identidade visual" description="Personalize a marca aplicada às experiências do Growth Loop."/><SettingsManager section="branding"/></>;
}

