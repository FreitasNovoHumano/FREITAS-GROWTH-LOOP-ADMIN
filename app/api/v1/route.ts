import { NextResponse } from "next/server";

import {
  AuthorizationError,
  requireAdministrator,
} from "@/lib/authorization";

async function ownerOnlyPlaceholder() {
  try {
    await requireAdministrator();
    return NextResponse.json(
      { error: "Endpoint ainda não implementado." },
      { status: 501 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Acesso negado." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}

export const GET = ownerOnlyPlaceholder;
export const POST = ownerOnlyPlaceholder;
