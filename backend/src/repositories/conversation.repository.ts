import { prisma } from "../config/database";

export const conversationRepository = {
  async createDirect(userAId: string, userBId: string) {
    // Évite de dupliquer une conversation directe déjà existante entre
    // les deux mêmes utilisateurs.
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId: userAId } } },
          { members: { some: { userId: userBId } } },
        ],
      },
      include: { members: true },
    });
    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        type: "direct",
        members: { create: [{ userId: userAId }, { userId: userBId }] },
      },
      include: { members: true },
    });
  },

  createGroup(creatorId: string, name: string | undefined, memberIds: string[]) {
    const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));
    return prisma.conversation.create({
      data: {
        type: "group",
        name,
        members: {
          create: uniqueMembers.map((userId) => ({
            userId,
            role: userId === creatorId ? "admin" : "member",
          })),
        },
      },
      include: { members: true },
    });
  },

  findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: { members: { where: { leftAt: null } } },
    });
  },

  findByIdWithMembers(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          where: { leftAt: null },
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
  },

  async isMember(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    return !!member;
  },

  listForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { members: { some: { userId, leftAt: null } } },
      include: {
        members: {
          where: { leftAt: null },
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  touch(id: string) {
    return prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  },

  async addMembers(conversationId: string, userIds: string[]) {
    return prisma.conversationMember.createMany({
      data: userIds.map((userId) => ({ conversationId, userId })),
      skipDuplicates: true,
    });
  },

  async removeMember(conversationId: string, userId: string) {
    return prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { leftAt: new Date() },
    });
  },

  async isAdmin(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null, role: "admin" },
    });
    return !!member;
  },

  leave(conversationId: string, userId: string) {
    return prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { leftAt: new Date() },
    });
  },

  mute(conversationId: string, userId: string, mutedUntil: Date | null) {
    return prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { mutedUntil },
    });
  },
};
