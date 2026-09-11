import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

// Valide body/params/query avant d'entrer dans le controller.
// En cas d'échec, l'erreur ZodError est interceptée par errorHandler.
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    req.body = parsed.body ?? req.body;
    next();
  };
}
