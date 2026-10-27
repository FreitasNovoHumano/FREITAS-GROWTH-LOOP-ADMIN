// Migração única: move as integrações do Growth Loop (Resend e WhatsApp) da
// coleção "Integration" (que pertence ao app principal / ManyChat) para a
// coleção própria "GrowthLoopIntegration".
//
// Uso, na pasta freitas-growth-loop-admin:
//   node scripts/migrar-integracoes.mjs            -> copia (não apaga nada)
//   node scripts/migrar-integracoes.mjs --limpar   -> apaga as cópias antigas da coleção "Integration"
//
// Rode a cópia ANTES de publicar a versão que usa "GrowthLoopIntegration".
// Rode --limpar só depois de confirmar que o painel do Loop mostra as integrações.

import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

const LOOP_PROVIDERS = ["RESEND", "WHATSAPP"];
const prisma = new PrismaClient();

// O MongoDB pode devolver números no formato estendido ({ $numberInt: "3" }).
function toNumber(value) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    return Number(value.$numberInt ?? value.$numberLong ?? value.$numberDouble ?? 0);
  }
  return Number(value ?? 0);
}

async function count(collection, query = {}) {
  const result = await prisma.$runCommandRaw({ count: collection, query });
  return toNumber(result.n);
}

async function copy() {
  const before = await count("Integration", { provider: { $in: LOOP_PROVIDERS } });
  console.log(`Integrações do Loop encontradas em "Integration": ${before}`);

  if (before > 0) {
    await prisma.$runCommandRaw({
      aggregate: "Integration",
      pipeline: [
        { $match: { provider: { $in: LOOP_PROVIDERS } } },
        {
          $merge: {
            into: "GrowthLoopIntegration",
            on: "_id",
            whenMatched: "keepExisting",
            whenNotMatched: "insert",
          },
        },
      ],
      cursor: {},
    });
  }

  await prisma.$runCommandRaw({
    createIndexes: "GrowthLoopIntegration",
    indexes: [
      {
        key: { clientId: 1, provider: 1, name: 1 },
        name: "GrowthLoopIntegration_clientId_provider_name_key",
        unique: true,
      },
    ],
  });

  const after = await count("GrowthLoopIntegration");
  console.log(`Documentos em "GrowthLoopIntegration": ${after}`);
  console.log("Cópia concluída. Nada foi apagado.");
}

async function cleanup() {
  const copied = await count("GrowthLoopIntegration");
  const old = await count("Integration", { provider: { $in: LOOP_PROVIDERS } });
  if (copied < old) {
    throw new Error(
      `A coleção nova tem ${copied} documento(s) e a antiga ${old}. Rode a cópia antes de limpar.`,
    );
  }
  const result = await prisma.$runCommandRaw({
    delete: "Integration",
    deletes: [{ q: { provider: { $in: LOOP_PROVIDERS } }, limit: 0 }],
  });
  console.log(`Removidos de "Integration": ${toNumber(result.n)} documento(s) do Loop.`);
}

try {
  if (process.argv.includes("--limpar")) await cleanup();
  else await copy();
} catch (error) {
  console.error("Falha na migração:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
