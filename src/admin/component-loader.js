import path from "node:path";
import { fileURLToPath } from "node:url";
import { ComponentLoader } from "adminjs";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const componentLoader = new ComponentLoader();

export const Components = {
  GrowthDashboard: componentLoader.add(
    "GrowthDashboard",
    path.join(currentDirectory, "dashboard", "dashboard.component.jsx"),
  ),
};
