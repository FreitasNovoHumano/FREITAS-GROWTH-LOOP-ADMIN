import { SettingsManager } from "@/components/settings/settings-manager";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><SettingsPageHeader title="Segurança e acesso" description="Consulte as políticas realmente aplicadas a papéis, sessão e dados."/><SettingsManager section="security"/></>;
}

