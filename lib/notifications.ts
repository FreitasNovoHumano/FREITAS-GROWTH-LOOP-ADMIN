import { prisma } from "@/lib/prisma";

// As notificações ficam na coleção compartilhada e aparecem também no app principal:
// links relativos apontariam para rotas que só existem no Growth Loop.
function absoluteLoopLink(link: string) {
  if (!link.startsWith("/")) return link;
  const base = (
    process.env.GROWTH_LOOP_NEXTAUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "https://freitas-growth-loop-admin.vercel.app"
  ).replace(/\/$/, "");
  return `${base}${link}`;
}

export async function notifyClient(input: {
  clientId: string;
  eventKey?: string;
  title: string;
  message: string;
  type: string;
  link: string;
}) {
  try {
    const settings = await prisma.clientSettings.findUnique({
      where: { clientId: input.clientId },
      select: { notificationPanelEnabled: true, notificationEvents: true },
    });
    const eventKey = input.eventKey ?? (input.type === "GROWTH_LOOP_LEAD" ? "lead.created" : null);
    if (settings && (!settings.notificationPanelEnabled || (eventKey && !settings.notificationEvents.includes(eventKey)))) return;
    const users = await prisma.user.findMany({
      where: { clientId: input.clientId },
      select: { id: true },
    });
    if (users.length === 0) return;

    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        clientId: input.clientId,
        title: input.title,
        message: input.message,
        type: input.type,
        link: absoluteLoopLink(input.link),
      })),
    });
  } catch (error) {
    console.error(
      "growth_loop_notification_failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}
