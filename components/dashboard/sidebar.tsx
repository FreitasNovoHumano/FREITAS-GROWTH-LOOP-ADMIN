import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { ClientSidebar } from "@/components/dashboard/client-sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function Sidebar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "Usuário",
    email: session.user.email ?? "",
  };

  if (session.user.role === "ADMIN") {
    return <AdminSidebar user={user} />;
  }

  const campaign = session.user.clientId
    ? await prisma.growthLoopCampaign.findFirst({
        where: { clientId: session.user.clientId, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { slug: true },
      })
    : null;
  const publicCampaignHref = campaign
    ? `/growth-loop/${campaign.slug}?clientId=${session.user.clientId}`
    : undefined;

  return (
    <ClientSidebar publicCampaignHref={publicCampaignHref} user={user} />
  );
}
