const whatsappNumberSchema = /^\d{10,15}$/;

export function parseWhatsAppNumbers(value: string | readonly string[]) {
  const values = Array.isArray(value) ? value : [value];
  const normalized = values
    .flatMap((item) => item.split(/[;,]/))
    .map((item) => item.replace(/\D/g, ""))
    .filter(Boolean);
  return [...new Set(normalized)].filter((number) => whatsappNumberSchema.test(number));
}

export function isValidWhatsAppNumber(value: string) {
  return whatsappNumberSchema.test(value);
}

export function maskWhatsAppNumber(value: string) {
  if (value.length <= 6) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}
