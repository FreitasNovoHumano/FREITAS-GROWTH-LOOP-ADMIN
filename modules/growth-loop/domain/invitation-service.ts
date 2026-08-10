import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone, opaqueToken, hashValue } from "@/lib/security";
import { queueAutomationEvent } from "@/modules/growth-loop/notifications/automation-events";

export async function createInvitation(input: { inviterId: string; email: string; phone?: string }) {
  const inviter = await prisma.participant.findUnique({ where: { id: input.inviterId } });
  if (!inviter) throw new Error("Participante não encontrado");
  const normalizedEmail = normalizeEmail(input.email);
  const existing = await prisma.invitation.findUnique({
    where: { campaignId_inviterId_normalizedEmail: { campaignId: inviter.campaignId, inviterId: inviter.id, normalizedEmail } },
  });
  if (existing) return { invitation: existing, created: false };

  const invitation = await prisma.invitation.create({ data: {
    clientId: inviter.clientId,
    campaignId: inviter.campaignId,
    inviterId: inviter.id,
    inviteeEmail: input.email.trim(),
    normalizedEmail,
    inviteePhone: input.phone?.trim() || undefined,
    normalizedPhone: normalizePhone(input.phone),
    tokenHash: hashValue(opaqueToken()),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
  } });
  await queueAutomationEvent({
    clientId: invitation.clientId,
    aggregateType: "Invitation",
    aggregateId: invitation.id,
    eventType: "InvitationCreated",
    campaignId: invitation.campaignId,
  }).catch(() => undefined);
  return { invitation, created: true };
}
