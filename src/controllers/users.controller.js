import prisma from "../config/database.js";

export async function listUsers(_request, response, next) {
  try { response.json(await prisma.user.findMany({ orderBy: { createdAt: "desc" } })); }
  catch (error) { next(error); }
}

export async function getUser(request, response, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.params.id } });
    return user ? response.json(user) : response.status(404).json({ error: "Usuário não encontrado." });
  } catch (error) { return next(error); }
}

export async function updateUser(request, response, next) {
  try {
    const { name, email, role, clientId } = request.body;
    const user = await prisma.user.update({
      where: { id: request.params.id },
      data: { name, email, role, clientId },
    });
    return response.json(user);
  } catch (error) { return next(error); }
}

export async function deleteUser(request, response, next) {
  try {
    await prisma.user.delete({ where: { id: request.params.id } });
    return response.status(204).send();
  } catch (error) { return next(error); }
}
