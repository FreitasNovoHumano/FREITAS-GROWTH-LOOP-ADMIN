import { createHmac, timingSafeEqual } from "node:crypto";

const LINK_VERSION = "v1";

function linkSecret(secret?: string) {
  const value = secret ?? process.env.EMBED_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error(
      "Defina EMBED_TOKEN_SECRET ou NEXTAUTH_SECRET para gerar links de confirmação.",
    );
  }
  return value;
}

export function participantAccessSignature(participantId: string, secret?: string) {
  return createHmac("sha256", linkSecret(secret))
    .update(`participant-access.${LINK_VERSION}.${participantId}`)
    .digest("base64url");
}

export function verifyParticipantAccessSignature(
  participantId: string,
  signature: string,
  secret?: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(participantId) || !signature) return false;
  const expected = Buffer.from(participantAccessSignature(participantId, secret));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// Link enviado no e-mail de boas-vindas: confirma que o participante recebeu o e-mail.
export function participantAccessUrl(baseUrl: string, participantId: string, secret?: string) {
  const params = new URLSearchParams({
    sig: participantAccessSignature(participantId, secret),
  });
  return `${baseUrl}/api/public/participants/${participantId}/confirm?${params}`;
}
