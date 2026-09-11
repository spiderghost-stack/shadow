import type { Server } from "socket.io";

// Le service HTTP (messages envoyés via REST par exemple, ou jobs internes)
// a besoin de pouvoir pousser un événement temps réel sans dépendre
// directement du module d'initialisation du serveur -> singleton simple.
let ioInstance: Server | null = null;

export function setIO(io: Server) {
  ioInstance = io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.IO n'a pas encore été initialisé.");
  }
  return ioInstance;
}

export const SOCKET_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ: "message:read",
  MESSAGE_EDITED: "message:edited",
  MESSAGE_DELETED: "message:deleted",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  PRESENCE_UPDATE: "presence:update",
  DEVICE_REVOKED: "device:revoked",
  CONVERSATION_UPDATED: "conversation:updated",
  // Signalisation d'appel — transporte uniquement les métadonnées nécessaires
  // à l'établissement d'une connexion WebRTC (offer/answer/ICE candidates),
  // jamais de flux audio/vidéo (qui ne transiteraient de toute façon jamais
  // par ce serveur en pair-à-pair). Nécessite un client WebRTC natif
  // (incompatible Expo Go) pour être utilisée de bout en bout — voir
  // mobile/src/services/webrtc/README.md.
  CALL_INVITE: "call:invite",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal", // offer / answer / ICE candidate, opaque pour le serveur
} as const;

// Chaque utilisateur rejoint une room à son id -> permet de cibler tous ses
// appareils connectés en une seule émission (utile pour la synchro multi-device).
export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function conversationRoom(conversationId: string) {
  return `conversation:${conversationId}`;
}
