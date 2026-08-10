import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/authorization";

export function settingsApiError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Revise os campos informados.", fields: error.flatten().fieldErrors }, { status: 400 });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: error instanceof AuthorizationError ? 403 : 500 },
  );
}

