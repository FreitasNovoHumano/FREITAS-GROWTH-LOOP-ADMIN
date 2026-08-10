import { NextResponse } from "next/server";

import { requireAdminTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { settingsApiError } from "@/modules/settings/api";
import { brandingSchema } from "@/modules/settings/schemas";
import { getBranding, saveBranding } from "@/modules/settings/service";

export async function GET() {
  try {
    const { clientId } = await requireAdminTenant();
    return NextResponse.json(await getBranding(clientId));
  } catch (error) { return settingsApiError(error, "Não foi possível carregar a identidade visual."); }
}

export async function PATCH(request: Request) {
  try {
    const input = brandingSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    await saveBranding(clientId, input);
    await prisma.auditLog.create({ data: {
      clientId, actorId: userId, actorType: "USER", action: "SETTINGS_BRANDING_UPDATED",
      entityType: "Client", entityId: clientId, metadata: { brandName: input.brandName, buttonStyle: input.buttonStyle },
    } });
    return NextResponse.json(await getBranding(clientId));
  } catch (error) { return settingsApiError(error, "Não foi possível salvar a identidade visual."); }
}

