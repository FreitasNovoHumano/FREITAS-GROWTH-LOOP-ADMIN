import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let nextCleanupAt = 0;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

type RateLimitInput = {
  scope: string;
  subject: string;
  limit: number;
  windowMs?: number;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function positiveInteger(value: number, fallback: number) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export function envRateLimit(name: string, fallback: number) {
  return positiveInteger(Number(process.env[name]), fallback);
}

export function requestClientId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return `ip:${forwarded}`;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return `ip:${realIp}`;
  return `unknown:${hash(request.headers.get("user-agent") ?? "unknown").slice(0, 16)}`;
}

async function cleanupExpiredBuckets(now: Date) {
  if (now.getTime() < nextCleanupAt) return;
  nextCleanupAt = now.getTime() + CLEANUP_INTERVAL_MS;
  try {
    await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } });
  } catch (error) {
    console.error("Não foi possível limpar buckets expirados de rate limit:", error);
  }
}

export async function consumeRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = positiveInteger(input.windowMs ?? WINDOW_MS, WINDOW_MS);
  const limit = positiveInteger(input.limit, 1);
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const resetAt = new Date(windowStart + windowMs);
  const id = hash(`${input.scope}:${input.subject}:${windowStart}:${windowMs}`);

  await cleanupExpiredBuckets(now);

  let bucket;
  try {
    bucket = await prisma.rateLimitBucket.upsert({
      where: { id },
      update: { count: { increment: 1 } },
      create: { id, count: 1, resetAt, expiresAt: resetAt },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    bucket = await prisma.rateLimitBucket.update({
      where: { id },
      data: { count: { increment: 1 } },
    });
  }

  const remaining = Math.max(0, limit - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
  return {
    allowed: bucket.count <= limit,
    limit,
    remaining,
    resetAt,
    retryAfterSeconds,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    "cache-control": "no-store",
    "ratelimit-limit": String(result.limit),
    "ratelimit-remaining": String(result.remaining),
    "ratelimit-reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
  };
  if (!result.allowed) headers["retry-after"] = String(result.retryAfterSeconds);
  return headers;
}

export function rateLimitExceeded(result: RateLimitResult) {
  return NextResponse.json(
    { success: false, error: "Limite de requisições excedido. Tente novamente em instantes." },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}
