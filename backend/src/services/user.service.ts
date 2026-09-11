import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import { securityEventRepository } from "../repositories/securityEvent.repository";
import { hashPassword, verifyPassword } from "../utils/password";
import { AppError } from "../utils/AppError";

export const userService = {
  async getProfile(id: string) {
    const user = await userRepository.findPublicById(id);
    if (!user) throw AppError.notFound("Utilisateur introuvable.");
    return user;
  },

  search(query: string, requesterId: string) {
    return userRepository.searchByUsername(query, requesterId);
  },

  updateProfile(userId: string, data: Parameters<typeof userRepository.updateProfile>[1]) {
    return userRepository.updateProfile(userId, data);
  },

  updatePrivacy(userId: string, data: Parameters<typeof userRepository.updatePrivacySettings>[1]) {
    return userRepository.updatePrivacySettings(userId, data);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("Utilisateur introuvable.");

    const valid = await verifyPassword(user.passwordHash, currentPassword);
    if (!valid) {
      throw AppError.unauthorized("Mot de passe actuel incorrect.", "INVALID_CURRENT_PASSWORD");
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, newHash);
    // Changement de mot de passe -> on révoque toutes les sessions actives
    // par précaution (sauf celle en cours, gérée côté client qui devra se
    // reconnecter sur les autres appareils).
    await sessionRepository.revokeAllForUser(userId);
    await securityEventRepository.log({ userId, type: "password_changed" });
    return { success: true };
  },
};
