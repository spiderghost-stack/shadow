import type { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { userRepository } from "../repositories/user.repository";
import { deviceRepository } from "../repositories/device.repository";
import { messageRepository } from "../repositories/message.repository";
import { conversationRepository } from "../repositories/conversation.repository";
import {
  setIO,
  SOCKET_EVENTS,
  userRoom,
  conversationRoom,
} from "./registry";

interface AuthedSocket extends Socket {
  auth?: { userId: string; deviceId: string };
}

export function initWebsocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  // Authentification obligatoire à la connexion : même token d'accès que
  // le REST. Un socket non authentifié est immédiatement refusé.
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("UNAUTHORIZED"));
    try {
      const payload = verifyAccessToken(token);
      socket.auth = { userId: payload.userId, deviceId: payload.deviceId };
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const { userId, deviceId } = socket.auth!;
    socket.join(userRoom(userId));

    logger.debug({ userId, deviceId }, "Socket connecté");

    // Rejoint la room de chacune de ses conversations actives pour recevoir
    // les nouveaux messages en temps réel.
    const conversations = await conversationRepository.listForUser(userId);
    conversations.forEach((c: { id: string }) => socket.join(conversationRoom(c.id)));

    await userRepository.updateLastSeen(userId);
    io.to(userRoom(userId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId, online: true });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING_START, { conversationId, userId });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.TYPING_STOP, { conversationId, userId });
    });

    socket.on(
      SOCKET_EVENTS.MESSAGE_DELIVERED,
      async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
        await messageRepository.markDelivered(messageId);
        socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { messageId });
      },
    );

    socket.on("conversation:join", ({ conversationId }: { conversationId: string }) => {
      socket.join(conversationRoom(conversationId));
    });

    // --- Signalisation d'appel (audio/vidéo) ---------------------------
    // Le serveur ne fait que relayer ces messages à l'autre participant :
    // il ne comprend pas leur contenu (offer/answer SDP, candidats ICE) et
    // ne transporte jamais le flux média lui-même (pair-à-pair via WebRTC
    // côté client). Fonctionnel dès qu'un client WebRTC est branché
    // dessus (nécessite un dev client, incompatible Expo Go — voir
    // mobile/src/services/webrtc/README.md).
    socket.on(
      SOCKET_EVENTS.CALL_INVITE,
      ({ conversationId, callType }: { conversationId: string; callType: "audio" | "video" }) => {
        socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.CALL_INVITE, {
          conversationId,
          callType,
          fromUserId: userId,
          fromDeviceId: deviceId,
        });
      },
    );

    socket.on(SOCKET_EVENTS.CALL_ACCEPT, ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.CALL_ACCEPT, { conversationId, fromUserId: userId });
    });

    socket.on(SOCKET_EVENTS.CALL_REJECT, ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.CALL_REJECT, { conversationId, fromUserId: userId });
    });

    socket.on(SOCKET_EVENTS.CALL_END, ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.CALL_END, { conversationId, fromUserId: userId });
    });

    socket.on(SOCKET_EVENTS.CALL_SIGNAL, ({ conversationId, signal }: { conversationId: string; signal: unknown }) => {
      // `signal` est opaque pour le serveur (offer/answer SDP ou candidat
      // ICE) : il est relayé tel quel, jamais inspecté ni journalisé.
      socket.to(conversationRoom(conversationId)).emit(SOCKET_EVENTS.CALL_SIGNAL, { conversationId, signal, fromUserId: userId });
    });

    socket.on("disconnect", async () => {
      logger.debug({ userId, deviceId }, "Socket déconnecté");
      await userRepository.updateLastSeen(userId);
      await deviceRepository.touchLastActive(deviceId);
      io.to(userRoom(userId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId, online: false });
    });
  });

  setIO(io);
  return io;
}
