import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { syncModels } from "./models/index.js";

async function start() {
  try {
    await connectDatabase();
    await syncModels();
    const { app, admin } = createApp();
    if (env.nodeEnv === "development") await admin.watch();
    app.listen(env.port, () => console.log(`AdminJS em http://localhost:${env.port}${admin.options.rootPath}`));
  } catch (error) {
    console.error("Falha ao iniciar o AdminJS:", error);
    process.exit(1);
  }
}
start();
