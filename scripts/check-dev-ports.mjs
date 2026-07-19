import net from "node:net";

const services = [
  { name: "Next.js", port: 3001 },
  { name: "AdminJS", port: Number(process.env.ADMIN_PORT ?? 3002) },
  { name: "SMTP local", port: 1025 },
  { name: "Caixa de entrada local", port: 1080 },
];

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") return resolve(false);
      return reject(error);
    });
    server.listen({ port, host: "::" }, () => {
      server.close(() => resolve(true));
    });
  });
}

const unavailable = [];
for (const service of services) {
  if (!await isPortAvailable(service.port)) unavailable.push(service);
}

if (unavailable.length) {
  console.error("\nNão foi possível iniciar o ambiente de desenvolvimento.");
  for (const service of unavailable) {
    console.error(`- Porta ${service.port} (${service.name}) já está em uso.`);
  }
  console.error("\nEncerre o terminal antigo com Ctrl+C e execute npm run admin:dev novamente.\n");
  process.exit(1);
}

console.log("Portas 3001, 3002, 1025 e 1080 disponíveis.");
