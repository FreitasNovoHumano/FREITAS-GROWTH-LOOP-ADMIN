import { z } from "zod";

export const participantSchema = z.object({
  name: z.string().trim().min(2, { message: "Informe seu nome." }).max(100, { message: "Nome muito longo." }),
  email: z.string().trim().email({ message: "Informe um e-mail válido." }).max(200, { message: "E-mail muito longo." }),
  phone: z
    .string()
    .trim()
    .max(30, { message: "Informe um WhatsApp válido com DDD." })
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || /^\d{10,15}$/.test(value.replace(/\D/g, "")), { message: "Informe um WhatsApp válido com DDD." }),
  referralCode: z.string().trim().max(30).optional(),
  consent: z.literal(true, { message: "É preciso aceitar os termos para participar." }),
});
