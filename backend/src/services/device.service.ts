import { deviceRepository } from "../repositories/device.repository";
import { sessionRepository } from "../repositories/session.repository";
import { securityEventRepository } from "../repositories/securityEvent.repository";
import { AppError } from "../utils/AppError";

export const deviceService = {
  listMyDevices(userId: string) {
    return deviceRepository.listForUser(userId);
  },

  // Bundle de clés publiques nécessaire à un tiers pour initier une session
  // chiffrée avec cet appareil précis (section 8/9 : chaque appareil a ses
  // propres clés). Ne renvoie jamais de clé privée.
  async getPublicBundle(deviceId: string) {
    const bundle = await deviceRepository.getPublicBundle(deviceId);
    if (!bundle) {
      throw AppError.notFound("Appareil introuvable ou révoqué.", "DEVICE_NOT_FOUND");
    }
    return bundle;
  },

  async rename(userId: string, deviceId: string, deviceName: string) {
    const device = await deviceRepository.findById(deviceId);
    if (!device || device.userId !== userId) {
      throw AppError.notFound("Appareil introuvable.", "DEVICE_NOT_FOUND");
    }
    return deviceRepository.rename(deviceId, deviceName);
  },

  async revoke(userId: string, deviceId: string) {
    const device = await deviceRepository.findById(deviceId);
    if (!device || device.userId !== userId) {
      throw AppError.notFound("Appareil introuvable.", "DEVICE_NOT_FOUND");
    }
    await deviceRepository.revoke(deviceId);
    await sessionRepository.revokeAllForDevice(deviceId);
    await securityEventRepository.log({
      userId,
      type: "device_revoked",
      metadata: { deviceId },
    });
    return { revoked: true };
  },

  async replenishPreKeys(deviceId: string, keys: { keyId: number; publicKey: string }[]) {
    await deviceRepository.replenishPreKeys(deviceId, keys);
    return { remaining: await deviceRepository.countRemainingPreKeys(deviceId) };
  },

  async setPushToken(deviceId: string, pushToken: string) {
    await deviceRepository.setPushToken(deviceId, pushToken);
    return { success: true };
  },
};
