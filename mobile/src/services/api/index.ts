import { api } from "./client";
import type { RemoteDeviceBundle } from "../../crypto/types";

export const conversationsApi = {
  list: () => api.get("/conversations").then((r) => r.data.conversations),
  getDetail: (conversationId: string) => api.get(`/conversations/${conversationId}`).then((r) => r.data.conversation),
  createDirect: (userId: string) =>
    api.post("/conversations", { type: "direct", memberIds: [userId] }).then((r) => r.data.conversation),
  createGroup: (name: string, memberIds: string[]) =>
    api.post("/conversations", { type: "group", name, memberIds }).then((r) => r.data.conversation),
  leave: (conversationId: string) => api.post(`/conversations/${conversationId}/leave`),
  mute: (conversationId: string, mutedUntil: string | null) =>
    api.post(`/conversations/${conversationId}/mute`, { mutedUntil }),
  addMembers: (conversationId: string, userIds: string[]) =>
    api.post(`/conversations/${conversationId}/members`, { userIds }),
  removeMember: (conversationId: string, userId: string) =>
    api.delete(`/conversations/${conversationId}/members/${userId}`),
};

export const messagesApi = {
  list: (conversationId: string, cursor?: string) =>
    api
      .get(`/conversations/${conversationId}/messages`, { params: { cursor, limit: 30 } })
      .then((r) => r.data.messages),

  send: (
    conversationId: string,
    body: {
      clientMessageId: string;
      type: string;
      encryptedPayload: string;
      nonce: string;
      encryptionVersion: number;
      senderEphemeralPublicKey?: string;
      usedOneTimePreKeyId?: number;
      replyToId?: string;
      ephemeralSeconds?: number;
      attachments?: {
        fileType: string;
        mimeType?: string;
        sizeBytes: number;
        storageUrl: string;
        encryptionNonce: string;
        checksumSha256?: string;
      }[];
    },
  ) => api.post(`/conversations/${conversationId}/messages`, body).then((r) => r.data.message),

  markRead: (conversationId: string, messageIds: string[]) =>
    api.post(`/conversations/${conversationId}/messages/read`, { messageIds }),

  edit: (messageId: string, encryptedPayload: string, nonce: string) =>
    api.patch(`/messages/${messageId}`, { encryptedPayload, nonce }),

  remove: (messageId: string) => api.delete(`/messages/${messageId}`),
};

export const devicesApi = {
  list: () => api.get("/devices").then((r) => r.data.devices),
  getBundle: (deviceId: string): Promise<RemoteDeviceBundle> =>
    api.get(`/devices/${deviceId}/bundle`).then((r) => ({ deviceId, ...r.data.bundle })),
  rename: (deviceId: string, deviceName: string) => api.patch(`/devices/${deviceId}`, { deviceName }),
  revoke: (deviceId: string) => api.delete(`/devices/${deviceId}`),
  replenishPreKeys: (keys: { keyId: number; publicKey: string }[]) =>
    api.post("/devices/me/prekeys", { keys }),
  setPushToken: (pushToken: string) => api.post("/devices/me/push-token", { pushToken }),
};

export const moderationApi = {
  block: (userId: string) => api.post(`/moderation/blocks/${userId}`),
  unblock: (userId: string) => api.delete(`/moderation/blocks/${userId}`),
  listBlocked: () => api.get("/moderation/blocks").then((r) => r.data.blocks),
  report: (userId: string, reason: string, description?: string) =>
    api.post(`/moderation/reports/${userId}`, { reason, description }),
};

export const usersApi = {
  me: () => api.get("/users/me").then((r) => r.data.user),
  search: (q: string) => api.get("/users/search", { params: { q } }).then((r) => r.data.users),
  getById: (userId: string) => api.get(`/users/${userId}`).then((r) => r.data.user),
  getPrimaryDeviceId: (userId: string): Promise<string> =>
    api.get(`/users/${userId}/primary-device`).then((r) => r.data.deviceId),
  updateProfile: (data: Record<string, unknown>) => api.patch("/users/me/profile", data).then((r) => r.data.user),
  updatePrivacy: (data: Record<string, unknown>) => api.patch("/users/me/privacy", data).then((r) => r.data.user),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/users/me/change-password", { currentPassword, newPassword }),
  getSecurityEvents: () => api.get("/users/me/security-events").then((r) => r.data.events),
};
