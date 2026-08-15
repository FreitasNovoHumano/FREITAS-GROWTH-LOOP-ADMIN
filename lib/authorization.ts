import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class AuthorizationError extends Error {}

export async function requireAdministrator() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new AuthorizationError("Acesso exclusivo para administradores");
  }
  return session;
}

export async function requireTenant(requestedClientId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AuthorizationError("Não autenticado");
  const isAdmin = session.user.role === "ADMIN";
  let clientId = isAdmin ? requestedClientId ?? session.user.clientId : session.user.clientId;
  if (isAdmin && !clientId) clientId = (await prisma.client.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;
  if (!clientId) throw new AuthorizationError("Nenhuma empresa vinculada");
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, company: true },
  });
  if (!client) throw new AuthorizationError("Empresa não encontrada");
  const clientName = client.company?.trim() || client.name;
  return { userId: session.user.id, clientId, clientName, isAdmin, session };
}

export async function requireAdminTenant(requestedClientId?: string) {
  const tenant = await requireTenant(requestedClientId);
  if (!tenant.isAdmin) {
    throw new AuthorizationError("Ação disponível somente para administradores");
  }
  return tenant;
}
