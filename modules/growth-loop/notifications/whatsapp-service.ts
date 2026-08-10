import { parseWhatsAppNumbers } from "@/modules/growth-loop/notifications/whatsapp-numbers";
import { getWhatsAppProvider, type WhatsAppProvider } from "@/modules/growth-loop/notifications/whatsapp-provider";
import { sendWhatsAppBatch } from "@/modules/growth-loop/notifications/whatsapp-batch";

export async function sendWhatsApp(input: {
  clientId?: string;
  to: string | readonly string[];
  message: string;
  provider?: WhatsAppProvider;
}) {
  const numbers = parseWhatsAppNumbers(input.to);
  if (!numbers.length) throw new Error("Nenhum número de WhatsApp válido informado");
  if (!input.provider && !input.clientId) throw new Error("Tenant não informado para o provider de WhatsApp");
  const provider = input.provider ?? await getWhatsAppProvider(input.clientId!);
  return sendWhatsAppBatch(numbers, input.message, provider);
}
