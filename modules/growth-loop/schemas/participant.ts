import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  referralCode: z.string().trim().max(30).optional(),
  invited_by_lead_slug: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/).optional(),
  consent: z.literal(true),
});
