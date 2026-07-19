import type { NextConfig } from "next";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const growthLoopUrl = process.env.GROWTH_LOOP_NEXTAUTH_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  ?? "https://freitas-growth-loop-admin.vercel.app";

process.env.NEXTAUTH_URL = growthLoopUrl;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
