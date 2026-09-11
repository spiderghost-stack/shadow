import { prisma } from "../config/database";

export const blockRepository = {
  block(blockerId: string, blockedId: string) {
    return prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  },

  unblock(blockerId: string, blockedId: string) {
    return prisma.block.deleteMany({ where: { blockerId, blockedId } });
  },

  async isBlockedEitherWay(userAId: string, userBId: string) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  },

  listBlockedByMe(userId: string) {
    return prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
  },
};

export const reportRepository = {
  create(params: { reporterId: string; reportedId: string; reason: string; description?: string }) {
    return prisma.report.create({ data: params });
  },
};
