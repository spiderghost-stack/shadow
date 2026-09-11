import rateLimit from "express-rate-limit";

// Section 47 / 33 du cahier des charges : protection contre les tentatives
// de connexion répétées et le spam. Limites volontairement strictes sur
// les routes sensibles (auth), plus permissives ailleurs.

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Trop de tentatives, réessayez plus tard." } },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Trop de requêtes, ralentissez." } },
});

export const messageRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Envoi trop rapide, patientez un instant." } },
});
