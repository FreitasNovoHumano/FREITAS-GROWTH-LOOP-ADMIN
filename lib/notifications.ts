import { prisma } from "@/lib/prisma";

export async function notifyClient(input: {
  clientId: string;
  title: string;
  message: string;
  type: string;
  link: string;
}) {
  try {
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
        link: input.link,
      })),
    });
  } catch (error) {
    console.error(
      "growth_loop_notification_failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}
