import { SettingsManager } from "@/components/settings/settings-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><SettingsPageHeader title="Notificações" description="Escolha quais eventos reais devem gerar alertas no painel."/><SettingsManager section="notifications"/></>;
}
