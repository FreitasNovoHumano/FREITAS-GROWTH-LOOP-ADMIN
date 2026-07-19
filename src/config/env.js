import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config();

const requiredInProduction = ["DATABASE_URL", "NEXTAUTH_SECRET", "ADMIN_LOGIN_URL"];
const positiveInteger = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};

if (process.env.NODE_ENV === "production") {
  for (const name of requiredInProduction) {
    if (!process.env[name]) throw new Error(`Variável obrigatória ausente: ${name}`);
  }
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.ADMIN_PORT ?? 3002),
  databaseUrl: process.env.DATABASE_URL,
  nextAuthSecret: process.env.NEXTAUTH_SECRET,
  loginUrl: process.env.ADMIN_LOGIN_URL ?? "https://freitas-growth-loop-admin.vercel.app/login",
  apiKey: process.env.ADMIN_API_KEY,
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "https://freitas-growth-loop-admin.vercel.app").replace(/\/$/, ""),
  adminPublicUrl: (process.env.ADMIN_PUBLIC_URL ?? "http://localhost:3002").replace(/\/$/, ""),
  growthLoopPublicBaseUrl: (process.env.GROWTH_LOOP_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://freitas-growth-loop-admin.vercel.app").replace(/\/$/, ""),
  growthLoopApiBaseUrl: (process.env.GROWTH_LOOP_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, ""),
  freitasGrowthMainUrl: (process.env.FREITAS_GROWTH_MAIN_URL ?? "https://freitasgrowthai.app").replace(/\/$/, ""),
  growthLoopReadRateLimit: positiveInteger("GROWTH_LOOP_READ_RATE_LIMIT_PER_MINUTE", 120),
  growthLoopWriteRateLimit: positiveInteger("GROWTH_LOOP_WRITE_RATE_LIMIT_PER_MINUTE", 10),
  isProduction: process.env.NODE_ENV === "production",
});
