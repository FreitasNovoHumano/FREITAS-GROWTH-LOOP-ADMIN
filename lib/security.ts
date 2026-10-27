import { createHash, randomBytes } from "crypto";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizePhone = (value?: string) => value?.replace(/\D/g, "") || undefined;
export const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");
export const referralCode = () => randomBytes(6).toString("base64url");
export const opaqueToken = () => randomBytes(32).toString("base64url");

// Forma canônica usada só para detectar autorreferência: ignora "+tag" e, no Gmail, os pontos.
export function canonicalEmail(value: string) {
  const [local = "", domain = ""] = normalizeEmail(value).split("@");
  const base = local.split("+")[0];
  const isGmail = domain === "gmail.com" || domain === "googlemail.com";
  return `${isGmail ? base.replaceAll(".", "") : base}@${isGmail ? "gmail.com" : domain}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
