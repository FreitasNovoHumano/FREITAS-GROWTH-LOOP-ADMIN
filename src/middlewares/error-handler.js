export function errorHandler(error, _request, response, _next) {
  void _next;
  console.error(error);
  const status = error.name?.startsWith("Prisma") ? 400 : 500;
  response.status(status).json({
    error: status === 400 ? error.message : "Erro interno do servidor.",
  });
}
