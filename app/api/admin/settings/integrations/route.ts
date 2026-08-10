import { NextResponse } from "next/server";

import { requireAdminTenant } from "@/lib/authorization";
import { settingsApiError } from "@/modules/settings/api";
import { integrationSettingsSchema } from "@/modules/settings/schemas";
import { getIntegrationSettings, saveIntegrationSettings } from "@/modules/settings/service";

export async function GET() {
  try {
    const { clientId } = await requireAdminTenant();
    return NextResponse.json(await getIntegrationSettings(clientId));
  } catch (error) { return settingsApiError(error, "Não foi possível carregar as integrações."); }
}

export async function PATCH(request: Request) {
  try {
    const input = integrationSettingsSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    return NextResponse.json(await saveIntegrationSettings(clientId, userId, input));
  } catch (error) { return settingsApiError(error, "Não foi possível salvar as integrações."); }
}

