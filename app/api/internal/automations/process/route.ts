import { NextResponse } from "next/server";

import { hashValue } from "@/lib/security";
import { processAutomationEvents } from "@/modules/growth-loop/notifications/notification-service";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !token || hashValue(token) !== hashValue(secret)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "20");
  return NextResponse.json(await processAutomationEvents(Number.isFinite(limit) ? limit : 20));
}
