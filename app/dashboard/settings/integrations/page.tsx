import { SettingsManager } from "@/components/settings/settings-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><SettingsPageHeader title="Integrações" description="Conecte provedores e acompanhe quais automações estão operacionais."/><SettingsManager section="integrations"/></>;
}

