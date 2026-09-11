import { messageRepository } from "../repositories/message.repository";
import { conversationRepository } from "../repositories/conversation.repository";
import { deviceRepository } from "../repositories/device.repository";
import { conversationService } from "./conversation.service";
import { AppError } from "../utils/AppError";
import { getIO, SOCKET_EVENTS, conversationRoom } from "../websocket/registry";
import { sendPushNotifications } from "../utils/pushNotifications";

export const messageService = {
  async send(params: {
    conversationId: string;
    senderId: string;
    senderDeviceId: string;
    type: string;
    encryptedPayload: string;
    nonce: string;
    encryptionVersion: number;
    replyToId?: string;
    ephemeralSeconds?: number;
    attachments?: Parameters<typeof messageRepository.create>[0]["attachments"];
  }) {
    await conversationService.assertMember(params.conversationId, params.senderId);

    // Le serveur ne fait ABSOLUMENT rien d'autre que stocker et relayer le
    // blob chiffré : pas de lecture, pas d'indexation du contenu, pas de
    // scan (section "Ce que le serveur backend NE DOIT JAMAIS FAIRE").
    const message = await messageRepository.create(params);
    await conversationRepository.touch(params.conversationId);

    getIO().to(conversationRoom(params.conversationId)).emit(SOCKET_EVENTS.MESSAGE_NEW, {
      message,
    });

    // Notification générique, envoyée en tâche de fond : jamais de contenu
    // de message, seulement "vous avez reçu un message" (voir
    // utils/pushNotifications.ts). Un échec d'envoi ne doit jamais faire
    // échouer l'envoi du message lui-même.
    deviceRepository
      .findPushTargets(params.conversationId, params.senderId)
      .then((tokens) =>
        sendPushNotifications(tokens, {
          title: "Shadow",
          body: "Nouveau message",
          data: { conversationId: params.conversationId },
        }),
      )
      .catch(() => undefined);

    return message;
  },

  async listPage(conversationId: string, userId: string, limit = 30, cursor?: string) {
    await conversationService.assertMember(conversationId, userId);
    return messageRepository.listPage(conversationId, limit, cursor);
  },

  async markRead(conversationId: string, userId: string, messageIds: string[]) {
    await conversationService.assertMember(conversationId, userId);
    await messageRepository.markReadBulk(messageIds);
    getIO().to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_READ, {
      conversationId,
      messageIds,
      readBy: userId,
    });
    return { updated: messageIds.length };
  },

  async edit(messageId: string, userId: string, encryptedPayload: string, nonce: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing) throw AppError.notFound("Message introuvable.");
    if (existing.senderId !== userId) throw AppError.forbidden("Vous ne pouvez modifier que vos messages.");

    const updated = await messageRepository.edit(messageId, encryptedPayload, nonce);
    getIO().to(conversationRoom(existing.conversationId)).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
      message: updated,
    });
    return updated;
  },

  async deleteForAll(messageId: string, userId: string) {
    const existing = await messageRepository.findById(messageId);
    if (!existing) throw AppError.notFound("Message introuvable.");
    if (existing.senderId !== userId) throw AppError.forbidden("Vous ne pouvez supprimer que vos messages.");

    await messageRepository.deleteForAll(messageId);
    getIO().to(conversationRoom(existing.conversationId)).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      messageId,
      conversationId: existing.conversationId,
    });
    return { deleted: true };
  },
};
