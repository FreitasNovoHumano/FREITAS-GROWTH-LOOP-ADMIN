import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { ClientSidebar } from "@/components/dashboard/client-sidebar";
import { authOptions } from "@/lib/auth";

export async function Sidebar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "Usuário",
    email: session.user.email ?? "",
  };

  return session.user.role === "ADMIN" ? (
    <AdminSidebar user={user} />
  ) : (
    <ClientSidebar user={user} />
  );
}
