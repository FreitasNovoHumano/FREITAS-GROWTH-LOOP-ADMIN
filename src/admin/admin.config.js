import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSSequelize from "@adminjs/sequelize";
import ConnectPgSimple from "connect-pg-simple";
import session from "express-session";
import { env } from "../config/env.js";
import { authenticate } from "./auth.provider.js";
import { resources } from "./resources.js";

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

export function createAdmin() {
  return new AdminJS({
    rootPath: "/admin",
    resources,
    branding: { companyName: "FreitasGrowthLoop", withMadeWithLove: false },
    locale: { language: "pt-BR", availableLanguages: ["pt-BR", "en"] },
  });
}

export function createAdminRouter(admin) {
  const PgStore = ConnectPgSimple(session);
  const store = new PgStore({
    conObject: {
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
    },
    tableName: "admin_sessions",
    createTableIfMissing: true,
  });

  return AdminJSExpress.buildAuthenticatedRouter(
    admin,
    { authenticate, cookieName: env.cookieName, cookiePassword: env.cookieSecret },
    null,
    {
      store,
      name: env.cookieName,
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      proxy: env.isProduction,
      cookie: { httpOnly: true, secure: env.isProduction, sameSite: "lax", maxAge: 28_800_000 },
    },
  );
}
