import { prisma } from "../config/database";

export const sessionRepository = {
  create(params: {
    userId: string;
    deviceId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddressHash?: string;
  }) {
    return prisma.session.create({ data: params });
  },

  findById(id: string) {
    return prisma.session.findUnique({ where: { id } });
  },

  revoke(id: string) {
    return prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllForDevice(deviceId: string) {
    return prisma.session.updateMany({
      where: { deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllForUser(userId: string) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
