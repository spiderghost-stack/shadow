import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Un seul client Prisma partagé (évite l'épuisement du pool de connexions
// en dev avec le rechargement à chaud).
export const prisma = new PrismaClient({
  log: env.isProd ? ["error", "warn"] : ["error", "warn"],
});
