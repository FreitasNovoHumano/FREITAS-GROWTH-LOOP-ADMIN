import { NextResponse } from "next/server";

import { requireAdminTenant } from "@/lib/authorization";
import { settingsApiError } from "@/modules/settings/api";
import { secretSettingsSchema } from "@/modules/settings/schemas";
import { getSecretSettings, saveSecret } from "@/modules/settings/service";

export async function GET() {
  try {
    const { clientId } = await requireAdminTenant();
    return NextResponse.json(await getSecretSettings(clientId));
  } catch (error) { return settingsApiError(error, "Não foi possível carregar os segredos."); }
}

export async function PUT(request: Request) {
  try {
    const input = secretSettingsSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    return NextResponse.json(await saveSecret(clientId, userId, input.key, input.value));
  } catch (error) { return settingsApiError(error, "Não foi possível salvar o segredo."); }
}

