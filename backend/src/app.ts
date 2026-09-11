import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimiters";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { deviceRouter } from "./routes/device.routes";
import { conversationRouter, messageRouter } from "./routes/conversation.routes";
import { moderationRouter } from "./routes/moderation.routes";
import { uploadRouter } from "./routes/upload.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "1mb" })); // les pièces jointes passent par /api/uploads (multipart), pas par le JSON
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));
app.use(apiRateLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Fichiers déjà chiffrés côté client : leur exposition en lecture ne
// compromet pas la confidentialité (illisibles sans la clé de session),
// mais reste un point à durcir en V2 (accès authentifié par conversation).
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/messages", messageRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/uploads", uploadRouter);

app.use(notFoundHandler);
app.use(errorHandler);
