import { randomBytes } from "node:crypto";
import prisma from "../src/config/database.js";

const leadSlug = () => randomBytes(18).toString("base64url");

const dryRun = process.argv.includes("--dry-run");
const batchSizeArgument = process.argv.find((argument) => argument.startsWith("--batch-size="));
const parsedBatchSize = Number(batchSizeArgument?.split("=")[1] ?? 100);
const batchSize = Number.isSafeInteger(parsedBatchSize) && parsedBatchSize >= 1 && parsedBatchSize <= 500
  ? parsedBatchSize
  : 100;

async function uniqueSlug() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = leadSlug();
    const exists = await prisma.lead.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error("Não foi possível gerar um slug único para o lead.");
}

async function inferredInviterLeadId(lead) {
  if (!lead.participantId) return null;
  const referral = await prisma.referral.findFirst({
    where: { campaignId: lead.campaignId, referredParticipantId: lead.participantId },
    select: { referrerParticipantId: true },
  });
  if (!referral) return null;
  const inviter = await prisma.lead.findFirst({
    where: { campaignId: lead.campaignId, participantId: referral.referrerParticipantId },
    select: { id: true },
  });
  return inviter?.id ?? null;
}

async function main() {
  let cursor;
  const totals = { inspected: 0, slugsCreated: 0, membershipsCreated: 0, membershipsExisting: 0 };

  while (true) {
    const leads = await prisma.lead.findMany({
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      select: { id: true, clientId: true, campaignId: true, participantId: true, slug: true },
    });
    if (leads.length === 0) break;

    for (const lead of leads) {
      totals.inspected += 1;
      const membership = await prisma.leadCampaign.findUnique({
        where: { campaignId_leadId: { campaignId: lead.campaignId, leadId: lead.id } },
        select: { id: true },
      });
      const needsSlug = !lead.slug;
      const needsMembership = !membership;
      if (needsSlug) totals.slugsCreated += 1;
      if (needsMembership) totals.membershipsCreated += 1;
      else totals.membershipsExisting += 1;

      if (!dryRun && (needsSlug || needsMembership)) {
        const slug = lead.slug ?? await uniqueSlug();
        const invitedByLeadId = needsMembership ? await inferredInviterLeadId(lead) : null;
        await prisma.$transaction(async (transaction) => {
          if (needsSlug) await transaction.lead.update({ where: { id: lead.id }, data: { slug } });
          if (needsMembership) {
            await transaction.leadCampaign.create({
              data: {
                clientId: lead.clientId,
                campaignId: lead.campaignId,
                leadId: lead.id,
                invitedByLeadId,
              },
            });
          }
        });
      }
    }
    cursor = leads.at(-1).id;
  }

  if (!dryRun) {
    await prisma.$runCommandRaw({
      createIndexes: "Lead",
      indexes: [{
        key: { slug: 1 },
        name: "Lead_slug_unique_when_present",
        unique: true,
        partialFilterExpression: { slug: { $type: "string" } },
      }],
    });
  }

  console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "write", batchSize, ...totals }, null, 2));
}

main()
  .catch((error) => {
    console.error("Falha na migração de LeadCampaign:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
