import "dotenv/config";

const requiredInProduction = [
  "ADMIN_DATABASE_URL",
  "ADMIN_COOKIE_SECRET",
  "ADMIN_SESSION_SECRET",
];

if (process.env.NODE_ENV === "production") {
  for (const name of requiredInProduction) {
    if (!process.env[name]) throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.ADMIN_PORT ?? 3002),
  databaseUrl:
    process.env.ADMIN_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/freitas_growth_loop_admin",
  databaseSsl: process.env.ADMIN_DATABASE_SSL === "true",
  databaseLogging: process.env.ADMIN_DATABASE_LOGGING === "true",
  cookieName: process.env.ADMIN_COOKIE_NAME ?? "freitas_growth_admin",
  cookieSecret: process.env.ADMIN_COOKIE_SECRET ?? "development-cookie-secret-change-me",
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? "development-session-secret-change-me",
  apiKey: process.env.ADMIN_API_KEY,
  isProduction: process.env.NODE_ENV === "production",
});
