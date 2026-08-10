import { z } from "zod";

export const emailProviderSchema = z.object({
  senderName: z.string().trim().min(2).max(120),
  senderEmail: z.string().trim().email().max(200),
  apiKey: z.string().trim().min(20).max(500).optional().or(z.literal("")),
});

export type StoredEmailProvider = {
  version: 1;
  senderName: string;
  senderEmail: string;
  apiKey?: string;
  credentialSource: "integration" | "environment";
};

export function emailFromEnvironment() {
  const value = process.env.EMAIL_FROM?.trim() ?? "";
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  return match
    ? { senderName: match[1].trim(), senderEmail: match[2].trim() }
    : { senderName: "", senderEmail: value.includes("@") ? value : "" };
}
