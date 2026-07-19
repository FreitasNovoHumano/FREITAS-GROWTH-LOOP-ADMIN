import express from "express";
import helmet from "helmet";
import { createAdmin, createAdminRouter } from "./admin/admin.config.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

export function createApp() {
  const app = express();
  const admin = createAdmin();
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.static("public"));
  app.use(admin.options.rootPath, ...createAdminRouter(admin));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", routes);
  app.get("/", (_request, response) => response.json({
    application: "FreitasGrowthLoop Admin",
    admin: "/admin",
    health: "/api/health",
  }));
  app.use(notFound);
  app.use(errorHandler);
  return { app, admin };
}
