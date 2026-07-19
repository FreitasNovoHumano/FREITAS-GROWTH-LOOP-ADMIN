import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

export function requireAdminApiKey(request, response, next) {
  const supplied = request.get("x-admin-api-key") ?? "";
  const expected = env.apiKey ?? "";
  const valid = supplied.length === expected.length && supplied.length > 0 &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return response.status(401).json({ error: "Nao autorizado." });
  return next();
}
