import { conversationRepository } from "../repositories/conversation.repository";
import { blockRepository } from "../repositories/block.repository";
import { AppError } from "../utils/AppError";

export const conversationService = {
  async createDirect(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw AppError.badRequest("Impossible de créer une conversation avec vous-même.");
    }
    const blocked = await blockRepository.isBlockedEitherWay(userId, otherUserId);
    if (blocked) {
      throw AppError.forbidden("Impossible de démarrer cette conversation.", "BLOCKED");
    }
    return conversationRepository.createDirect(userId, otherUserId);
  },

  createGroup(creatorId: string, name: string | undefined, memberIds: string[]) {
    return conversationRepository.createGroup(creatorId, name, memberIds);
  },

  listMine(userId: string) {
    return conversationRepository.listForUser(userId);
  },

  async getDetail(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    const conversation = await conversationRepository.findByIdWithMembers(conversationId);
    if (!conversation) throw AppError.notFound("Conversation introuvable.");
    return conversation;
  },

  async assertMember(conversationId: string, userId: string) {
    const isMember = await conversationRepository.isMember(conversationId, userId);
    if (!isMember) {
      throw AppError.forbidden("Vous ne faites pas partie de cette conversation.");
    }
  },

  async leave(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await conversationRepository.leave(conversationId, userId);
    return { left: true };
  },

  async mute(conversationId: string, userId: string, mutedUntil: Date | null) {
    await this.assertMember(conversationId, userId);
    await conversationRepository.mute(conversationId, userId, mutedUntil);
    return { muted: true };
  },

  async addMembers(conversationId: string, requesterId: string, userIds: string[]) {
    const isAdmin = await conversationRepository.isAdmin(conversationId, requesterId);
    if (!isAdmin) throw AppError.forbidden("Seul un administrateur peut ajouter des membres.");
    await conversationRepository.addMembers(conversationId, userIds);
    return { added: userIds.length };
  },

  async removeMember(conversationId: string, requesterId: string, targetUserId: string) {
    const isAdmin = await conversationRepository.isAdmin(conversationId, requesterId);
    if (!isAdmin && requesterId !== targetUserId) {
      throw AppError.forbidden("Seul un administrateur peut retirer un autre membre.");
    }
    await conversationRepository.removeMember(conversationId, targetUserId);
    return { removed: true };
  },
};
