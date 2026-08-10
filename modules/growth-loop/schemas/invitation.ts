import { z } from "zod";

export const invitationSchema = z.object({
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).refine((value) => /^\d{10,15}$/.test(value.replace(/\D/g, "")), "Informe um WhatsApp válido com código do país.").optional(),
});
