import pino from "pino";
import { env } from "../config/env";

// Règle non négociable (section 34 / 46 / 47 du cahier des charges) :
// aucun log ne doit jamais contenir un mot de passe, une clé privée,
// un token, un secret de déchiffrement ou un message en clair.
// La liste de redaction ci-dessous est volontairement large.
export const logger = pino({
  level: env.isProd ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "token",
      "*.token",
      "accessToken",
      "refreshToken",
      "*.refreshToken",
      "privateKey",
      "*.privateKey",
      "secret",
      "*.secret",
      "encryptedPayload",
      "*.encryptedPayload",
      "plaintext",
      "*.plaintext",
    ],
    censor: "[REDACTED]",
  },
  transport: env.isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});
