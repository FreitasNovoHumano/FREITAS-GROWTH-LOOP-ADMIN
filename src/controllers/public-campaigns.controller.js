import prisma from "../config/database.js";
import { env } from "../config/env.js";

const objectIdPattern = /^[a-f\d]{24}$/i;

async function proxyToOfficialApi(request, response, next, path) {
  try {
    const headers = {
      accept: request.get("accept") ?? "application/json",
      "content-type": request.get("content-type") ?? "application/json",
      "user-agent": request.get("user-agent") ?? "freitas-growth-loop-admin",
      "x-forwarded-for": request.get("x-forwarded-for") ?? request.ip,
    };
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const upstream = await fetch(`${env.growthLoopApiBaseUrl}${path}`, {
      method: request.method,
      headers,
      body: hasBody ? JSON.stringify(request.body ?? {}) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    const contentType = upstream.headers.get("content-type");
    const location = upstream.headers.get("location");
    if (contentType) response.set("content-type", contentType);
    if (location) response.set("location", location);
    return response.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    if (error?.name === "TimeoutError") {
      return response.status(504).json({ success: false, error: "A API oficial do Growth Loop não respondeu a tempo." });
    }
    return next(error);
  }
}

export async function getPublicCampaign(request, response, next) {
  if (
    objectIdPattern.test(request.params.slug)
    && env.apiKey
    && request.get("x-admin-api-key") === env.apiKey
  ) {
    try {
      const campaign = await prisma.growthLoopCampaign.findUnique({ where: { id: request.params.slug } });
      return campaign
        ? response.json(campaign)
        : response.status(404).json({ error: "Campanha não encontrada." });
    } catch (error) {
      return next(error);
    }
  }
  return proxyToOfficialApi(
    request,
    response,
    next,
    `/api/growth-loop/campaigns/${encodeURIComponent(request.params.slug)}`,
  );
}

export function registerLead(request, response, next) {
  return proxyToOfficialApi(
    request,
    response,
    next,
    `/api/growth-loop/campaigns/${encodeURIComponent(request.params.slug)}/register`,
  );
}

export function claimReward(request, response, next) {
  return proxyToOfficialApi(
    request,
    response,
    next,
    `/api/growth-loop/campaigns/${encodeURIComponent(request.params.slug)}/leads/${encodeURIComponent(request.params.lead_slug)}/reward`,
  );
}
