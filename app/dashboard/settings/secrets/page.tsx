import { SettingsManager } from "@/components/settings/settings-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><SettingsPageHeader title="Segredos de integração" description="Atualize credenciais criptografadas sem expor seus valores atuais."/><SettingsManager section="secrets"/></>;
}

