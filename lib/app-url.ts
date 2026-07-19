export const PRODUCTION_APP_ORIGIN = "https://freitas-growth-loop-admin.vercel.app";

export function productionAppUrl(path = "/") {
  return new URL(path, PRODUCTION_APP_ORIGIN).toString();
}
