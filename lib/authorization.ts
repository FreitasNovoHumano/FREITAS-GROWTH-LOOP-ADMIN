import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AuthorizationError extends Error {}

export async function requireTenant(requestedClientId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthorizationError("Não autenticado");
  const isAdmin = session.user.role === "ADMIN";
  let clientId = isAdmin ? requestedClientId ?? session.user.clientId : session.user.clientId;
  if (isAdmin && !clientId) clientId = (await prisma.client.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
  if (!clientId) throw new AuthorizationError("Nenhuma empresa vinculada");
  return { userId: session.user.id, clientId, isAdmin, session };
}
