import { createHash, randomBytes } from "crypto";

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizePhone = (value?: string) => value?.replace(/\D/g, "") || undefined;
export const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");
export const referralCode = () => randomBytes(6).toString("base64url");
export const leadSlug = () => randomBytes(18).toString("base64url");
export const opaqueToken = () => randomBytes(32).toString("base64url");

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
