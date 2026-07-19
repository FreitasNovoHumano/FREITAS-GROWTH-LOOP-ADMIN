import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/prisma";
import { requireGoogleAdmin } from "./auth.provider.js";
import { componentLoader, Components } from "./component-loader.js";
import { dashboardHandler } from "./dashboard/dashboard.handler.js";
import { resources } from "./resources.js";

AdminJS.registerAdapter({ Resource, Database });

export function createAdmin() {
  return new AdminJS({
    rootPath: "/admin",
    resources,
    componentLoader,
    dashboard: {
      component: Components.GrowthDashboard,
      handler: dashboardHandler,
    },
    branding: {
      companyName: "FreitasGrowthLoop",
      logo: "/freitas-loop.png",
      withMadeWithLove: false,
    },
    locale: { language: "pt-BR", availableLanguages: ["pt-BR", "en"] },
  });
}

export function createAdminRouter(admin) {
  return [requireGoogleAdmin, AdminJSExpress.buildRouter(admin)];
}
