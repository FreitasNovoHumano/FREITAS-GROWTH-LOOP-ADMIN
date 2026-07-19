import type { NextConfig } from "next";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
if (process.env.NODE_ENV === "development") {
  process.env.NEXTAUTH_URL = process.env.GROWTH_LOOP_NEXTAUTH_URL ?? "http://localhost:3001";
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
