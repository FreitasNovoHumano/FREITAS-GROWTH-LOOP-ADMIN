import { PageHeader } from "@/components/dashboard/page-header";
import { ResourceTable } from "@/components/dashboard/resource-table";
import { requireAdministrator } from "@/lib/authorization";

export default async function Page() {
  await requireAdministrator();
  return <><PageHeader eyebrow="PROTEÇÃO" title="Central antifraude" description="Revise duplicidades, autorreferências e comportamentos suspeitos."/><ResourceTable resource="fraud"/></>;
}
