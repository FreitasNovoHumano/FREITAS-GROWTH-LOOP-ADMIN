import { createHash } from "node:crypto";
import prisma from "../src/config/database.js";
import { campaigns, leads } from "./data/growth-loop-seed.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const date = (value) => new Date(value);

async function resolveOwner() {
  const preferredEmail = (process.env.SEED_USER_EMAIL ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase();
  const preferred = preferredEmail
    ? await prisma.user.findUnique({ where: { email: preferredEmail } })
    : null;
  const user = preferred ?? await prisma.user.findFirst({
    where: { clientId: { not: null } },
    orderBy: { createdAt: "asc" },
  }) ?? await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!user) throw new Error("Nenhum usuário existente foi encontrado. O seed não cria usuários.");

  const clientEmail = process.env.SEED_CLIENT_EMAIL?.trim().toLowerCase();
  const client = clientEmail
    ? await prisma.client.findUnique({ where: { email: clientEmail } })
    : user.clientId
      ? await prisma.client.findUnique({ where: { id: user.clientId } })
      : await prisma.client.findFirst({ orderBy: { createdAt: "asc" } });

  if (!client) throw new Error("Nenhum cliente existente foi encontrado. O seed não cria clientes.");
  return { user, client };
}

async function upsertCampaign(definition, campaignIndex, owner) {
  const startsAt = date(`2026-07-${String(campaignIndex + 1).padStart(2, "0")}T12:00:00.000Z`);
  const endsAt = date("2026-12-31T23:59:59.000Z");
  const campaignData = {
    clientId: owner.client.id,
    createdById: owner.user.id,
    name: definition.name,
    slug: definition.slug,
    description: definition.description,
    status: "ACTIVE",
    primaryColor: definition.primaryColor,
    accentColor: definition.accentColor,
    logoUrl: "/freitas-loop.png",
    initialRewardTitle: definition.initialRewardTitle,
    initialRewardValue: definition.initialRewardValue,
    milestoneRewardTitle: definition.milestoneRewardTitle,
    milestoneRewardValue: definition.milestoneRewardValue,
    qualifiedReferralGoal: definition.qualifiedReferralGoal,
    startsAt,
    endsAt,
  };
  const campaign = await prisma.growthLoopCampaign.upsert({
    where: { clientId_slug: { clientId: owner.client.id, slug: definition.slug } },
    create: campaignData,
    update: campaignData,
  });

  await prisma.campaignPage.upsert({
    where: { campaignId: campaign.id },
    create: {
      campaignId: campaign.id,
      headline: definition.headline,
      subheadline: definition.subheadline,
      heroImageUrl: "/freitas-loop.png",
      body: definition.body,
      ctaLabel: definition.ctaLabel,
      thankYouTitle: definition.thankYouTitle,
      publishedAt: startsAt,
    },
    update: {
      headline: definition.headline,
      subheadline: definition.subheadline,
      heroImageUrl: "/freitas-loop.png",
      body: definition.body,
      ctaLabel: definition.ctaLabel,
      thankYouTitle: definition.thankYouTitle,
      publishedAt: startsAt,
    },
  });

  await prisma.campaignRuleVersion.upsert({
    where: { campaignId_version: { campaignId: campaign.id, version: 1 } },
    create: {
      campaignId: campaign.id,
      version: 1,
      qualifiedReferralGoal: definition.qualifiedReferralGoal,
      requireEmailVerified: true,
      requireInitialAccess: true,
      blockSelfReferral: true,
      activeFrom: startsAt,
      activeUntil: endsAt,
      snapshot: { source: "seed-realista", policy: "cadastro-completo-e-acesso-inicial" },
    },
    update: {
      qualifiedReferralGoal: definition.qualifiedReferralGoal,
      activeFrom: startsAt,
      activeUntil: endsAt,
      snapshot: { source: "seed-realista", policy: "cadastro-completo-e-acesso-inicial" },
    },
  });

  for (const rewardDefinition of [
    { key: "cadastro", title: definition.initialRewardTitle, value: definition.initialRewardValue, milestone: "REGISTRATION", threshold: 0 },
    { key: "indicacoes", title: definition.milestoneRewardTitle, value: definition.milestoneRewardValue, milestone: "QUALIFIED_REFERRALS", threshold: definition.qualifiedReferralGoal },
  ]) {
    const reward = await prisma.reward.upsert({
      where: { campaignId_key: { campaignId: campaign.id, key: rewardDefinition.key } },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        key: rewardDefinition.key,
        title: rewardDefinition.title,
        description: `Benefício da campanha ${definition.name}.`,
        kind: "LINK",
        value: rewardDefinition.value,
        claimUrl: `http://localhost:3001/growth-loop/${definition.slug}`,
        active: true,
      },
      update: { title: rewardDefinition.title, value: rewardDefinition.value, active: true },
    });
    await prisma.rewardRuleVersion.upsert({
      where: { rewardId_version: { rewardId: reward.id, version: 1 } },
      create: {
        rewardId: reward.id,
        version: 1,
        milestone: rewardDefinition.milestone,
        threshold: rewardDefinition.threshold,
        snapshot: { campaign: definition.slug, threshold: rewardDefinition.threshold },
        effectiveFrom: startsAt,
        effectiveUntil: endsAt,
      },
      update: { threshold: rewardDefinition.threshold, effectiveUntil: endsAt },
    });
  }
  return campaign;
}

async function upsertAudience(campaign, campaignIndex, owner) {
  const group = leads.slice(campaignIndex * 10, campaignIndex * 10 + 10);
  const participants = [];

  for (const [personIndex, person] of group.entries()) {
    const normalizedEmail = person.email.toLowerCase();
    const occurredAt = date(`2026-07-${String(campaignIndex * 3 + personIndex + 1).padStart(2, "0")}T14:00:00.000Z`);
    const participant = await prisma.participant.upsert({
      where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        name: person.name,
        email: person.email,
        normalizedEmail,
        phone: person.phone,
        normalizedPhone: person.phone.replace(/\D/g, ""),
        referralCode: `FGL-${campaignIndex + 1}-${String(personIndex + 1).padStart(2, "0")}`,
        accessTokenHash: digest(`acesso:${campaign.slug}:${person.email}`),
        status: "ACTIVE",
        emailVerifiedAt: occurredAt,
        registrationCompletedAt: occurredAt,
        initialRewardAccessedAt: occurredAt,
        qualifiedReferralCount: personIndex === 0 ? 4 : 0,
        createdAt: occurredAt,
      },
      update: {
        name: person.name,
        email: person.email,
        phone: person.phone,
        normalizedPhone: person.phone.replace(/\D/g, ""),
        status: "ACTIVE",
        emailVerifiedAt: occurredAt,
        registrationCompletedAt: occurredAt,
        initialRewardAccessedAt: occurredAt,
        qualifiedReferralCount: personIndex === 0 ? 4 : 0,
      },
    });
    participants.push(participant);

    const seededLeadSlug = `seed-${digest(`${campaign.slug}:${normalizedEmail}`).slice(0, 24)}`;
    const lead = await prisma.lead.upsert({
      where: { campaignId_normalizedEmail: { campaignId: campaign.id, normalizedEmail } },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        participantId: participant.id,
        slug: seededLeadSlug,
        name: person.name,
        email: person.email,
        normalizedEmail,
        phone: person.phone,
        source: "referral",
        utmSource: person.channel,
        utmMedium: "indicacao-organica",
        utmCampaign: campaign.slug,
        convertedAt: occurredAt,
        createdAt: occurredAt,
      },
      update: {
        participantId: participant.id,
        slug: seededLeadSlug,
        name: person.name,
        phone: person.phone,
        utmSource: person.channel,
        utmMedium: "indicacao-organica",
        utmCampaign: campaign.slug,
        convertedAt: occurredAt,
      },
    });
    await prisma.leadCampaign.upsert({
      where: { campaignId_leadId: { campaignId: campaign.id, leadId: lead.id } },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        leadId: lead.id,
      },
      update: {},
    });
  }

  const referrer = participants[0];
  for (let index = 1; index < participants.length; index += 1) {
    const referred = participants[index];
    const person = group[index];
    const timestamp = date(`2026-07-${String(campaignIndex * 3 + index + 1).padStart(2, "0")}T16:00:00.000Z`);
    const status = index <= 4 ? "QUALIFIED" : index <= 7 ? "VALIDATED" : "REJECTED";
    const [referrerLead, referredLead] = await Promise.all([
      prisma.lead.findFirst({ where: { campaignId: campaign.id, participantId: referrer.id } }),
      prisma.lead.findFirst({ where: { campaignId: campaign.id, participantId: referred.id } }),
    ]);
    if (referrerLead && referredLead) {
      await prisma.leadCampaign.update({
        where: { campaignId_leadId: { campaignId: campaign.id, leadId: referredLead.id } },
        data: { invitedByLeadId: referrerLead.id },
      });
    }
    const invitation = await prisma.invitation.upsert({
      where: {
        campaignId_inviterId_normalizedEmail: {
          campaignId: campaign.id,
          inviterId: referrer.id,
          normalizedEmail: person.email.toLowerCase(),
        },
      },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        inviterId: referrer.id,
        inviteeEmail: person.email,
        normalizedEmail: person.email.toLowerCase(),
        tokenHash: digest(`convite:${campaign.slug}:${person.email}`),
        status: "ACCEPTED",
        expiresAt: date("2026-12-31T23:59:59.000Z"),
        openedAt: timestamp,
        acceptedAt: timestamp,
        createdAt: timestamp,
      },
      update: { status: "ACCEPTED", openedAt: timestamp, acceptedAt: timestamp },
    });
    await prisma.referral.upsert({
      where: { attributionKey: `seed:${campaign.slug}:${person.email}` },
      create: {
        clientId: owner.client.id,
        campaignId: campaign.id,
        invitationId: invitation.id,
        referrerParticipantId: referrer.id,
        referredParticipantId: referred.id,
        status,
        attributionKey: `seed:${campaign.slug}:${person.email}`,
        clickedAt: timestamp,
        registeredAt: timestamp,
        validatedAt: status === "REJECTED" ? null : timestamp,
        qualifiedAt: status === "QUALIFIED" ? timestamp : null,
        rejectedReason: status === "REJECTED" ? "Perfil fora dos critérios comerciais desta campanha" : null,
        ruleVersion: 1,
        createdAt: timestamp,
      },
      update: {
        invitationId: invitation.id,
        referrerParticipantId: referrer.id,
        referredParticipantId: referred.id,
        status,
        registeredAt: timestamp,
        validatedAt: status === "REJECTED" ? null : timestamp,
        qualifiedAt: status === "QUALIFIED" ? timestamp : null,
        rejectedReason: status === "REJECTED" ? "Perfil fora dos critérios comerciais desta campanha" : null,
        ruleVersion: 1,
      },
    });
  }
}

async function main() {
  const owner = await resolveOwner();
  for (const [index, definition] of campaigns.entries()) {
    const campaign = await upsertCampaign(definition, index, owner);
    await upsertAudience(campaign, index, owner);
  }
  const totals = await prisma.growthLoopCampaign.findMany({
    where: { clientId: owner.client.id, slug: { in: campaigns.map(({ slug }) => slug) } },
    select: { name: true, slug: true, status: true, _count: { select: { leads: true, participants: true, referrals: true } } },
    orderBy: { slug: "asc" },
  });
  console.log(JSON.stringify({ client: owner.client.name, campaigns: totals }, null, 2));
}

main()
  .catch((error) => {
    console.error("Falha ao popular o Growth Loop:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
