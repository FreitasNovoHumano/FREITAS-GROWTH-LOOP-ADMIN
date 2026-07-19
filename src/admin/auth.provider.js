import { getToken } from "next-auth/jwt";
import prisma from "../config/database.js";
import { env } from "../config/env.js";

function loginRedirect(request) {
  const callbackUrl = `${request.protocol}://${request.get("host")}${request.originalUrl}`;
  return `${env.loginUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export async function requireGoogleAdmin(request, response, next) {
  try {
    const token = await getToken({ req: request, secret: env.nextAuthSecret });
    if (!token?.email) return response.redirect(loginRedirect(request));

    const tokenEmail = token.email.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: tokenEmail } });
    if (!adminEmail || tokenEmail !== adminEmail || !user || user.role !== "ADMIN") {
      return response.status(403).send("Acesso restrito a administradores.");
    }

    request.currentAdmin = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
