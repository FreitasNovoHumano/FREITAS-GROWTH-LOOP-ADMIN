export function deliveryIdempotencyKey(eventId: string, channel: "EMAIL" | "WHATSAPP", recipientHash: string) {
  return `${eventId}:${channel}:${recipientHash}`;
}
