import type { NextConfig } from "next";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

// Em desenvolvimento o login volta para a máquina local; em produção usa a URL oficial.
const growthLoopUrl = process.env.NODE_ENV === "production"
  ? process.env.GROWTH_LOOP_NEXTAUTH_URL ?? "https://freitas-growth-loop-admin.vercel.app"
  : process.env.GROWTH_LOOP_DEV_URL ?? "http://localhost:3001";

process.env.NEXTAUTH_URL = growthLoopUrl;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
