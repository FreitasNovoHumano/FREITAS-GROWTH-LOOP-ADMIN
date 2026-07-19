import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await connectDatabase();
    const { app, admin } = createApp();
    if (env.nodeEnv === "development") {
      await admin.watch();
    } else {
      await admin.initialize();
    }
    const server = app.listen(env.port, () => {
      console.log(`AdminJS em http://localhost:${env.port}${admin.options.rootPath}`);
    });
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`A porta ${env.port} já está em uso. Encerre o servidor antigo e tente novamente.`);
      } else {
        console.error("Falha no servidor HTTP do AdminJS:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Falha ao iniciar o AdminJS:", error);
    process.exit(1);
  }
}
start();
