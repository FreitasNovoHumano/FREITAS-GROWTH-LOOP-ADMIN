import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireAdminTenant } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  emailTemplateDefinitions,
  emailTemplateKeySchema,
  serializeTemplate,
  templateInputSchema,
} from "@/modules/growth-loop/email/templates";

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const key = emailTemplateKeySchema.parse((await params).key);
    const input = templateInputSchema(key).parse(await request.json());
    const { clientId, userId } = await requireAdminTenant();
    const existing = await prisma.emailTemplate.findFirst({
      where: { clientId, campaignId: null, key },
      select: { id: true },
    });
    const data = {
      name: emailTemplateDefinitions[key].name,
      subject: input.subject,
      html: serializeTemplate({ key, ...input }),
      active: input.active,
    };
    const template = existing
      ? await prisma.emailTemplate.update({ where: { id: existing.id }, data, select: { id: true } })
      : await prisma.emailTemplate.create({
          data: { clientId, campaignId: null, key, ...data },
          select: { id: true },
        });
    await prisma.auditLog.create({
      data: {
        clientId,
        actorId: userId,
        actorType: "USER",
        action: "EMAIL_TEMPLATE_UPDATED",
        entityType: "EmailTemplate",
        entityId: template.id,
        metadata: { key, active: input.active },
      },
    });

    return NextResponse.json({ key, ...input });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Template inválido.", fields: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar o template." },
      { status: error instanceof AuthorizationError ? 403 : 500 },
    );
  }
}
