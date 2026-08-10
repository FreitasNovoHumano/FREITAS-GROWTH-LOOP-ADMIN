import { EmailAutomationManager } from "@/components/dashboard/email-automation-manager";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <EmailAutomationManager />;
}
