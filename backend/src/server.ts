import { createServer } from "node:http";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { initWebsocket } from "./websocket/socket";
import { prisma } from "./config/database";
import { messageRepository } from "./repositories/message.repository";

const httpServer = createServer(app);
initWebsocket(httpServer);

httpServer.listen(env.port, () => {
  logger.info(`Shadow API démarrée sur le port ${env.port} (${env.nodeEnv})`);
});

// Purge périodique des messages éphémères expirés (section "messages
// éphémères" du cahier des charges) — toutes les 60 secondes.
const purgeInterval = setInterval(() => {
  messageRepository
    .purgeExpired()
    .catch((err: unknown) => logger.error({ err }, "Échec purge messages expirés"));
}, 60_000);

async function shutdown() {
  clearInterval(purgeInterval);
  httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
