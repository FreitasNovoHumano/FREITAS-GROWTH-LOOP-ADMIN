import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  consumeRateLimit,
  envRateLimit,
  rateLimitExceeded,
  rateLimitHeaders,
  requestClientId,
} from "@/lib/rate-limit";
import {
  claimCampaignReward,
  getPublicCampaign,
  PublicCampaignError,
  registerForCampaign,
} from "@/modules/growth-loop/domain/public-campaign-service";

const READ_LIMIT = envRateLimit("GROWTH_LOOP_READ_RATE_LIMIT_PER_MINUTE", 120);
const WRITE_LIMIT = envRateLimit("GROWTH_LOOP_WRITE_RATE_LIMIT_PER_MINUTE", 10);
const EMAIL_LIMIT = envRateLimit("GROWTH_LOOP_EMAIL_RATE_LIMIT_PER_MINUTE", 3);
const SENSITIVE_LIMIT = envRateLimit("GROWTH_LOOP_SENSITIVE_RATE_LIMIT_PER_MINUTE", 20);

function normalizedValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

async function enforce(request: Request, scope: string, subject: string, limit: number) {
  const result = await consumeRateLimit({ scope, subject, limit });
  return result.allowed ? { response: null, result } : { response: rateLimitExceeded(result), result };
}

function errorResponse(error: unknown) {
  if (error instanceof PublicCampaignError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: "Dados inválidos.",
      details: error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
    }, { status: 400 });
  }
  console.error("Falha na API pública do Growth Loop:", error);
  return NextResponse.json({ success: false, error: "Erro interno." }, { status: 500 });
}

export async function handleGetCampaign(request: Request, slug: string) {
  try {
    const limited = await enforce(request, `campaign-read:${slug}`, requestClientId(request), READ_LIMIT);
    if (limited.response) return limited.response;
    return NextResponse.json(await getPublicCampaign(slug), { headers: rateLimitHeaders(limited.result) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleRegisterCampaign(request: Request, slug: string) {
  try {
    const clientId = requestClientId(request);
    const ipLimit = await enforce(request, `campaign-register:${slug}`, clientId, WRITE_LIMIT);
    if (ipLimit.response) return ipLimit.response;

    const input = await request.json() as Record<string, unknown>;
    const email = normalizedValue(input.email ?? input.lead_email);
    if (email) {
      const emailLimit = await enforce(request, `campaign-register-email:${slug}`, email, EMAIL_LIMIT);
      if (emailLimit.response) return emailLimit.response;
    }

    const result = await registerForCampaign(slug, input, {
      forwardedFor: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json(result, { status: 201, headers: rateLimitHeaders(ipLimit.result) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleClaimCampaignReward(request: Request, campaignSlug: string, leadSlug: string) {
  try {
    const limited = await enforce(
      request,
      `campaign-reward:${campaignSlug}`,
      requestClientId(request),
      SENSITIVE_LIMIT,
    );
    if (limited.response) return limited.response;

    const result = await claimCampaignReward(campaignSlug, leadSlug);
    return NextResponse.redirect(result.redirectUrl, {
      status: 303,
      headers: rateLimitHeaders(limited.result),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
