import { prisma } from "../config/database";

export const userRepository = {
  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findPublicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeen: true,
        showLastSeen: true,
        showOnlineStatus: true,
        showProfilePhoto: true,
      },
    });
  },

  searchByUsername(query: string, excludeUserId: string, limit = 20) {
    return prisma.user.findMany({
      where: {
        username: { contains: query, mode: "insensitive" },
        id: { not: excludeUserId },
      },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      take: limit,
    });
  },

  create(data: {
    username: string;
    displayName: string;
    passwordHash: string;
    email?: string;
  }) {
    return prisma.user.create({ data });
  },

  updateLastSeen(id: string) {
    return prisma.user.update({ where: { id }, data: { lastSeen: new Date() } });
  },

  updateProfile(
    id: string,
    data: Partial<{
      displayName: string;
      bio: string;
      status: string;
      avatarUrl: string;
    }>,
  ) {
    return prisma.user.update({ where: { id }, data });
  },

  updatePrivacySettings(
    id: string,
    data: Partial<{
      showLastSeen: boolean;
      showOnlineStatus: boolean;
      showReadReceipts: boolean;
      showProfilePhoto: boolean;
      hideNotificationBody: boolean;
      whoCanAddMe: string;
    }>,
  ) {
    return prisma.user.update({ where: { id }, data });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },
};
