import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  referralCode: z.string().trim().max(30).optional(),
  consent: z.literal(true),
});
