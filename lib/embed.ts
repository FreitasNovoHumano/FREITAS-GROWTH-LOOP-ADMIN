import { createHmac, timingSafeEqual } from "node:crypto";

import { publicCampaignClientIdSchema } from "@/lib/public-campaign";

const TOKEN_VERSION = "v1";

function tokenSecret(secret?: string) {
  const value = secret ?? process.env.EMBED_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error(
      "Defina EMBED_TOKEN_SECRET ou NEXTAUTH_SECRET para gerar scripts de embed.",
    );
  }
  return value;
}

function signature(payload: string, secret?: string) {
  return createHmac("sha256", tokenSecret(secret))
    .update(`${TOKEN_VERSION}.${payload}`)
    .digest("base64url");
}

export function createPublicClientToken(clientId: string, secret?: string) {
  const parsedClientId = publicCampaignClientIdSchema.parse(clientId);
  const payload = Buffer.from(parsedClientId, "utf8").toString("base64url");
  return `${TOKEN_VERSION}.${payload}.${signature(payload, secret)}`;
}

export function verifyPublicClientToken(token: string, secret?: string) {
  const [version, payload, receivedSignature, ...extra] = token.split(".");
  if (
    version !== TOKEN_VERSION ||
    !payload ||
    !receivedSignature ||
    extra.length > 0
  ) {
    return null;
  }

  const expectedSignature = signature(payload, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const clientId = Buffer.from(payload, "base64url").toString("utf8");
    const parsed = publicCampaignClientIdSchema.safeParse(clientId);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildEmbedSnippet(
  appOrigin: string,
  publicToken: string,
  campaignSlug: string,
) {
  const scriptUrl = new URL("/embed.js", appOrigin).toString();
  return `<script async src="${scriptUrl}" data-growth-loop-token="${publicToken}" data-growth-loop-campaign="${campaignSlug}"></script>`;
}
