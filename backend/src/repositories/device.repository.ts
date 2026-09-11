import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export const deviceRepository = {
  // Appareil actif le plus récent d'un utilisateur — utilisé par un tiers
  // pour savoir vers quel appareil chiffrer un premier message (MVP :
  // un seul appareil "principal" par utilisateur ; le vrai fan-out
  // multi-appareil par destinataire est prévu en V2).
  findPrimaryActiveDevice(userId: string) {
    return prisma.device.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
      select: { id: true },
    });
  },

  async createWithKeys(params: {
    userId: string;
    deviceName: string;
    deviceType: string;
    platform?: string;
    identityPublicKey: string;
    signedPreKeyPublic: string;
    signedPreKeySignature: string;
    oneTimePreKeys: { keyId: number; publicKey: string }[];
  }) {
    return prisma.device.create({
      data: {
        userId: params.userId,
        deviceName: params.deviceName,
        deviceType: params.deviceType,
        platform: params.platform,
        identityPublicKey: params.identityPublicKey,
        signedPreKeyPublic: params.signedPreKeyPublic,
        signedPreKeySignature: params.signedPreKeySignature,
        signedPreKeyCreatedAt: new Date(),
        oneTimePreKeys: {
          create: params.oneTimePreKeys.map((k) => ({ keyId: k.keyId, publicKey: k.publicKey })),
        },
      },
    });
  },

  findById(id: string) {
    return prisma.device.findUnique({ where: { id } });
  },

  listForUser(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        platform: true,
        createdAt: true,
        lastActiveAt: true,
        revokedAt: true,
      },
    });
  },

  touchLastActive(id: string) {
    return prisma.device.update({ where: { id }, data: { lastActiveAt: new Date() } });
  },

  rename(id: string, deviceName: string) {
    return prisma.device.update({ where: { id }, data: { deviceName } });
  },

  revoke(id: string) {
    return prisma.device.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  // Consomme UNE clé à usage unique disponible pour établir une nouvelle
  // session avec cet appareil (X3DH). Jamais réutilisée après consommation.
  async consumeOneTimePreKey(deviceId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const key = await tx.oneTimePreKey.findFirst({
        where: { deviceId, usedAt: null },
        orderBy: { keyId: "asc" },
      });
      if (!key) return null;
      await tx.oneTimePreKey.update({ where: { id: key.id }, data: { usedAt: new Date() } });
      return key;
    });
  },

  countRemainingPreKeys(deviceId: string) {
    return prisma.oneTimePreKey.count({ where: { deviceId, usedAt: null } });
  },

  replenishPreKeys(deviceId: string, keys: { keyId: number; publicKey: string }[]) {
    return prisma.oneTimePreKey.createMany({
      data: keys.map((k) => ({ deviceId, keyId: k.keyId, publicKey: k.publicKey })),
      skipDuplicates: true,
    });
  },

  setPushToken(deviceId: string, pushToken: string) {
    return prisma.device.update({ where: { id: deviceId }, data: { pushToken } });
  },

  // Jetons push de tous les appareils actifs des membres d'une conversation,
  // à l'exclusion de l'expéditeur — utilisé pour notifier sans jamais
  // transmettre le contenu du message (voir utils/pushNotifications.ts).
  async findPushTargets(conversationId: string, excludeUserId: string) {
    const members = await prisma.conversationMember.findMany({
      where: { conversationId, leftAt: null, userId: { not: excludeUserId } },
      include: {
        user: { select: { id: true, hideNotificationBody: true } },
      },
    });

    const now = new Date();
    const activeMemberIds = members
      .filter((m: { mutedUntil: Date | null }) => !m.mutedUntil || m.mutedUntil < now)
      .map((m: { user: { id: string } }) => m.user.id);

    if (activeMemberIds.length === 0) return [];

    const devices = await prisma.device.findMany({
      where: { userId: { in: activeMemberIds }, revokedAt: null, pushToken: { not: null } },
      select: { pushToken: true },
    });
    return devices.map((d: { pushToken: string | null }) => d.pushToken!).filter(Boolean);
  },

  // Bundle public nécessaire à un autre utilisateur pour initier une session
  // chiffrée avec cet appareil (aucune donnée privée n'est jamais renvoyée).
  async getPublicBundle(deviceId: string) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: {
        id: true,
        userId: true,
        identityPublicKey: true,
        signedPreKeyPublic: true,
        signedPreKeySignature: true,
        revokedAt: true,
      },
    });
    if (!device || device.revokedAt) return null;
    const oneTimePreKey = await this.consumeOneTimePreKey(deviceId);
    return { ...device, oneTimePreKey };
  },
};
