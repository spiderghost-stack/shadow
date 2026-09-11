import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// Dernier filet avant la réponse HTTP : ici on garantit qu'aucune information
// technique sensible (stack trace, message d'erreur Prisma/SQL, secret) ne
// fuite jamais vers le client (section 45 du cahier des charges).
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Certaines données envoyées sont invalides.",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, "Erreur applicative serveur");
    }
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }

  logger.error({ err, path: req.path }, "Erreur non gérée");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Une erreur interne est survenue." },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route introuvable." } });
}
