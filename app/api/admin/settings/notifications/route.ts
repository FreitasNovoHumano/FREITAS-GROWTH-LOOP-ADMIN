import { NextResponse } from "next/server";

import { requireAdminTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { settingsApiError } from "@/modules/settings/api";
import { notificationSettingsSchema } from "@/modules/settings/schemas";
import { getNotificationSettings, saveNotificationSettings } from "@/modules/settings/service";

export async function GET() {
  try {
    const { clientId } = await requireAdminTenant();
    return NextResponse.json(await getNotificationSettings(clientId));
  } catch (error) { return settingsApiError(error, "Não foi possível carregar as notificações."); }
}

export async function PATCH(request: Request) {
  try {
    const input = notificationSettingsSchema.parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    const settings = await saveNotificationSettings(clientId, input);
    await prisma.auditLog.create({ data: {
      clientId, actorId: userId, actorType: "USER", action: "SETTINGS_NOTIFICATIONS_UPDATED",
      entityType: "Client", entityId: clientId, metadata: { panelEnabled: input.panelEnabled, events: input.events },
    } });
    return NextResponse.json(settings);
  } catch (error) { return settingsApiError(error, "Não foi possível salvar as notificações."); }
}

