import { DefaultSession } from "next-auth";

type GrowthLoopRole = "ADMIN" | "CLIENT";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: GrowthLoopRole; clientId?: string } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT { id?: string; role?: GrowthLoopRole; clientId?: string }
}
