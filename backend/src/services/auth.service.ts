import { userRepository } from "../repositories/user.repository";
import { deviceRepository } from "../repositories/device.repository";
import { sessionRepository } from "../repositories/session.repository";
import { securityEventRepository } from "../repositories/securityEvent.repository";
import { prisma } from "../config/database";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sha256 } from "../utils/hash";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import type { LoginInput, RegisterInput } from "../validators/auth.validators";

interface DeviceContext {
  userAgent?: string;
  ipAddressHash?: string;
}

export const authService = {
  async register(input: RegisterInput, ctx: DeviceContext) {
    const existing = await userRepository.findByUsername(input.username);
    if (existing) {
      throw AppError.conflict("Ce nom d'utilisateur est déjà pris.", "USERNAME_TAKEN");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      email: input.email,
    });

    const device = await deviceRepository.createWithKeys({
      userId: user.id,
      deviceName: input.device.deviceName,
      deviceType: input.device.deviceType,
      platform: input.device.platform,
      identityPublicKey: input.device.identityPublicKey,
      signedPreKeyPublic: input.device.signedPreKeyPublic,
      signedPreKeySignature: input.device.signedPreKeySignature,
      oneTimePreKeys: input.device.oneTimePreKeys,
    });

    const tokens = await this.createTokenPair(user.id, device.id, ctx);

    await securityEventRepository.log({
      userId: user.id,
      type: "device_added",
      metadata: { deviceId: device.id, reason: "registration" },
    });

    return { user, device, ...tokens };
  },

  async login(input: LoginInput, ctx: DeviceContext) {
    const user = await userRepository.findByUsername(input.username);
    if (!user) {
      // Message volontairement identique au cas "mauvais mot de passe" :
      // ne jamais révéler si un nom d'utilisateur existe (section 33).
      throw AppError.unauthorized("Identifiants incorrects.", "INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      await securityEventRepository.log({ userId: user.id, type: "login_failed" });
      throw AppError.unauthorized("Identifiants incorrects.", "INVALID_CREDENTIALS");
    }

    const device = input.deviceId
      ? await this.resolveExistingDevice(user.id, input.deviceId)
      : await deviceRepository.createWithKeys({
          userId: user.id,
          deviceName: input.device!.deviceName,
          deviceType: input.device!.deviceType,
          platform: input.device!.platform,
          identityPublicKey: input.device!.identityPublicKey,
          signedPreKeyPublic: input.device!.signedPreKeyPublic,
          signedPreKeySignature: input.device!.signedPreKeySignature,
          oneTimePreKeys: input.device!.oneTimePreKeys,
        });

    const tokens = await this.createTokenPair(user.id, device.id, ctx);

    await securityEventRepository.log({
      userId: user.id,
      type: "login_success",
      metadata: { deviceId: device.id, newDevice: !input.deviceId },
    });

    return { user, device, ...tokens };
  },

  async resolveExistingDevice(userId: string, deviceId: string) {
    const device = await deviceRepository.findById(deviceId);
    if (!device || device.userId !== userId || device.revokedAt) {
      throw AppError.unauthorized(
        "Cet appareil n'est plus reconnu, reconnectez-vous en tant que nouvel appareil.",
        "DEVICE_UNKNOWN",
      );
    }
    await deviceRepository.touchLastActive(deviceId);
    return device;
  },

  async createTokenPair(userId: string, deviceId: string, ctx: DeviceContext) {
    const expiresAt = new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);
    const session = await sessionRepository.create({
      userId,
      deviceId,
      refreshTokenHash: "", // renseigné juste après (besoin de session.id pour signer)
      expiresAt,
      userAgent: ctx.userAgent,
      ipAddressHash: ctx.ipAddressHash,
    });

    const refreshToken = signRefreshToken({ sessionId: session.id });
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: sha256(refreshToken) },
    });

    const accessToken = signAccessToken({ userId, deviceId });
    return { accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Session invalide, reconnectez-vous.", "REFRESH_INVALID");
    }

    const session = await sessionRepository.findById(payload.sessionId);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw AppError.unauthorized("Session expirée, reconnectez-vous.", "REFRESH_EXPIRED");
    }
    if (session.refreshTokenHash !== sha256(refreshToken)) {
      // Le token présenté ne correspond pas à celui émis : possible vol de
      // token -> on révoque la session par précaution.
      await sessionRepository.revoke(session.id);
      throw AppError.unauthorized("Session invalide, reconnectez-vous.", "REFRESH_MISMATCH");
    }

    // Rotation du refresh token à chaque usage (limite la fenêtre de rejeu).
    await sessionRepository.revoke(session.id);
    const accessToken = signAccessToken({ userId: session.userId, deviceId: session.deviceId });
    const { refreshToken: newRefreshToken } = await this.createTokenPair(
      session.userId,
      session.deviceId,
      {},
    );
    await deviceRepository.touchLastActive(session.deviceId);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await sessionRepository.revoke(payload.sessionId);
    } catch {
      // Token déjà invalide : rien à faire, on considère la déconnexion réussie.
    }
  },
};
