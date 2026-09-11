import { prisma } from "../config/database";

export const messageRepository = {
  create(params: {
    conversationId: string;
    senderId: string;
    senderDeviceId: string;
    type: string;
    encryptedPayload: string;
    nonce: string;
    encryptionVersion: number;
    replyToId?: string;
    ephemeralSeconds?: number;
    senderEphemeralPublicKey?: string;
    usedOneTimePreKeyId?: number;
    attachments?: {
      fileType: string;
      mimeType?: string;
      sizeBytes: number;
      storageUrl: string;
      encryptionNonce: string;
      checksumSha256?: string;
    }[];
  }) {
    const expiresAt = params.ephemeralSeconds
      ? new Date(Date.now() + params.ephemeralSeconds * 1000)
      : undefined;

    return prisma.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
        senderDeviceId: params.senderDeviceId,
        type: params.type,
        encryptedPayload: params.encryptedPayload,
        nonce: params.nonce,
        encryptionVersion: params.encryptionVersion,
        replyToId: params.replyToId,
        ephemeralSeconds: params.ephemeralSeconds,
        expiresAt,
        senderEphemeralPublicKey: params.senderEphemeralPublicKey,
        usedOneTimePreKeyId: params.usedOneTimePreKeyId,
        attachments: params.attachments ? { create: params.attachments } : undefined,
      },
      include: { attachments: true },
    });
  },

  // Pagination par curseur (createdAt/id) : plus stable qu'un offset
  // lorsque de nouveaux messages arrivent pendant la pagination.
  async listPage(conversationId: string, limit: number, cursor?: string) {
    return prisma.message.findMany({
      where: {
        conversationId,
        deletedForAll: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { attachments: true },
    });
  },

  findById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  markDelivered(id: string) {
    return prisma.message.update({ where: { id }, data: { status: "delivered", deliveredAt: new Date() } });
  },

  markReadBulk(ids: string[]) {
    return prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { status: "read", readAt: new Date() },
    });
  },

  edit(id: string, encryptedPayload: string, nonce: string) {
    return prisma.message.update({
      where: { id },
      data: { encryptedPayload, nonce, editedAt: new Date() },
    });
  },

  deleteForAll(id: string) {
    return prisma.message.update({
      where: { id },
      data: {
        deletedForAll: true,
        deletedAt: new Date(),
        encryptedPayload: "",
        nonce: "",
      },
    });
  },

  // Purge des messages éphémères expirés — appelée par un job planifié.
  purgeExpired() {
    return prisma.message.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
