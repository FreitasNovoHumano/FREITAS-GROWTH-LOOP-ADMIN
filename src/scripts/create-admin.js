import "../config/env.js";
import prisma from "../config/database.js";

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Configure ADMIN_EMAIL no arquivo .env.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Faça login com Google uma vez antes de conceder acesso administrativo.");
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { role: "ADMIN", email: { not: email } },
      data: { role: "CLIENT" },
    }),
    prisma.user.update({ where: { email }, data: { role: "ADMIN" } }),
  ]);
  console.log(`Acesso administrativo concedido a ${email}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
