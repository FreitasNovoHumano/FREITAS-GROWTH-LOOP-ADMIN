import { getModelByName } from "@adminjs/prisma";
import prisma from "../config/database.js";

const resource = (modelName, options = {}) => ({
  resource: { model: getModelByName(modelName), client: prisma },
  options,
});

export const resources = [
  resource("User", {
    navigation: { name: "Administração", icon: "User" },
    listProperties: ["id", "name", "email", "role", "clientId", "createdAt"],
    editProperties: ["name", "email", "role", "clientId"],
    properties: {
      email: { isTitle: true },
      role: {
        availableValues: [
          { value: "ADMIN", label: "Administrador" },
          { value: "CLIENT", label: "Cliente" },
        ],
      },
    },
    actions: { bulkDelete: { isAccessible: false } },
  }),
  resource("Client"),
  resource("GrowthLoopCampaign", {
    navigation: { name: "Growth Loop", icon: "Bullhorn" },
    listProperties: ["name", "slug", "status", "qualifiedReferralGoal", "startsAt", "endsAt"],
    filterProperties: ["name", "slug", "status", "clientId", "startsAt", "endsAt"],
    showProperties: [
      "id", "clientId", "name", "slug", "description", "status", "initialRewardTitle",
      "milestoneRewardTitle", "qualifiedReferralGoal", "startsAt", "endsAt", "createdAt", "updatedAt",
    ],
    properties: { name: { isTitle: true } },
    actions: { delete: { isAccessible: false }, bulkDelete: { isAccessible: false } },
  }),
  resource("Participant"),
  resource("Lead", {
    navigation: { name: "Growth Loop", icon: "User" },
    listProperties: ["name", "email", "slug", "campaignId", "source", "convertedAt", "createdAt"],
    filterProperties: ["name", "email", "slug", "campaignId", "source", "createdAt"],
    showProperties: [
      "id", "clientId", "campaignId", "participantId", "slug", "name", "email", "normalizedEmail",
      "phone", "source", "utmSource", "utmMedium", "utmCampaign", "convertedAt", "createdAt",
    ],
    editProperties: ["name", "phone", "source", "utmSource", "utmMedium", "utmCampaign"],
    properties: { email: { isTitle: true }, slug: { isDisabled: true } },
    actions: { delete: { isAccessible: false }, bulkDelete: { isAccessible: false } },
  }),
  resource("LeadCampaign", {
    navigation: { name: "Growth Loop", icon: "Link" },
    listProperties: [
      "leadId", "campaignId", "invitedByLeadId", "firstRewardClaimCount", "firstRewardClaimedAt",
      "secondRewardSent", "secondRewardSentAt",
    ],
    filterProperties: ["campaignId", "leadId", "invitedByLeadId", "secondRewardSent", "createdAt"],
    showProperties: [
      "id", "clientId", "campaignId", "leadId", "invitedByLeadId", "firstRewardClaimedAt",
      "firstRewardLastClaimedAt", "firstRewardClaimCount", "secondRewardSent", "secondRewardSendingAt",
      "secondRewardSentAt", "createdAt", "updatedAt",
    ],
    editProperties: [],
    properties: {
      invitedByLeadId: { label: "Lead indicador" },
      firstRewardClaimedAt: { label: "1ª recompensa resgatada em" },
      firstRewardLastClaimedAt: { label: "Último acesso à 1ª recompensa" },
      firstRewardClaimCount: { label: "Acessos à 1ª recompensa" },
      secondRewardSent: { label: "2ª recompensa enviada" },
      secondRewardSentAt: { label: "2ª recompensa enviada em" },
    },
    actions: {
      new: { isAccessible: false },
      edit: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
  }),
  resource("Referral"),
  resource("Reward"),
];
