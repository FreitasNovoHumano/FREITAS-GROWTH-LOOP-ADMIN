export type WhatsAppBatchProvider = {
  send(input: { to: string; message: string }): Promise<{ providerId?: string }>;
};

export async function sendWhatsAppBatch(numbers: readonly string[], message: string, provider: WhatsAppBatchProvider) {
  const settled = await Promise.allSettled(numbers.map(async (number) => ({ number, ...(await provider.send({ to: number, message })) })));
  return settled.map((result, index) => result.status === "fulfilled"
    ? { number: numbers[index], status: "sent" as const, providerId: result.value.providerId }
    : { number: numbers[index], status: "failed" as const, error: result.reason instanceof Error ? result.reason.message : "Falha no envio" });
}
