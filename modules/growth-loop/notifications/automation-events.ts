import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const automationEventTypes = ["ParticipantRegistered", "InvitationCreated", "ReferralQualified", "RewardUnlocked"] as const;
export type AutomationEventType = (typeof automationEventTypes)[number];

export async function queueAutomationEvent(input: {
  clientId: string;
  aggregateType: "Participant" | "Invitation" | "Referral" | "RewardGrant";
  aggregateId: string;
  eventType: AutomationEventType;
  campaignId: string;
}) {
  try {
    return await prisma.domainEvent.create({
      data: {
        clientId: input.clientId,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        idempotencyKey: `${input.eventType}:${input.aggregateId}`,
        payload: { campaignId: input.campaignId },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}
