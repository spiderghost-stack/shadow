import { prisma } from "../config/database";

// Journal d'audit consultable par l'utilisateur (section "Sécurité" du menu
// Paramètres) : connexions, ajout/révocation d'appareil, rotation de clé...
// Ne contient jamais de contenu de message ni de secret.
export const securityEventRepository = {
  log(params: { userId?: string; type: string; metadata?: Record<string, unknown> }) {
    return prisma.securityEvent.create({
      data: { userId: params.userId, type: params.type, metadata: params.metadata ? (params.metadata as any) : undefined },
    });
  },

  listForUser(userId: string, limit = 50) {
    return prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
