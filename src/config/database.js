import { PrismaClient } from "@prisma/client";
import "./env.js";

const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  console.log("Conexão com MongoDB estabelecida.");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export default prisma;
