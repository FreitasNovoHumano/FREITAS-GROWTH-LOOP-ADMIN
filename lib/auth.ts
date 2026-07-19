import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

if (process.env.GROWTH_LOOP_NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.GROWTH_LOOP_NEXTAUTH_URL;
}

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    authorization: { params: { prompt: "select_account" } },
  })],
  callbacks: {
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.trim().toLowerCase();
      if (!email) return token;
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const expectedRole = adminEmail && email === adminEmail ? "ADMIN" : "CLIENT";
      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) {
        dbUser = await prisma.user.create({ data: {
          email,
          name: user?.name ?? token.name ?? email,
          image: user?.image ?? token.picture ?? null,
          role: expectedRole,
        }});
      } else if (dbUser.role !== expectedRole) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: expectedRole },
        });
      }
      if (dbUser.role === "CLIENT" && !dbUser.clientId) {
        const client = await prisma.client.findUnique({ where: { email } });
        if (client) dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { clientId: client.id } });
      }
      token.id = dbUser.id;
      token.role = dbUser.role;
      token.clientId = dbUser.clientId ?? undefined;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = String(token.role ?? "CLIENT");
        session.user.clientId = token.clientId ? String(token.clientId) : undefined;
      }
      return session;
    },
  },
};
