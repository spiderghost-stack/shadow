import { getSocket, SOCKET_EVENTS } from "../websocket/socket";

// Couche de signalisation SEULE : voir mobile/src/services/webrtc/README.md
// pour ce qu'il manque (capture/transport média réel via WebRTC).

export type CallType = "audio" | "video";

export const callSignaling = {
  invite(conversationId: string, callType: CallType) {
    getSocket()?.emit(SOCKET_EVENTS.CALL_INVITE, { conversationId, callType });
  },
  accept(conversationId: string) {
    getSocket()?.emit(SOCKET_EVENTS.CALL_ACCEPT, { conversationId });
  },
  reject(conversationId: string) {
    getSocket()?.emit(SOCKET_EVENTS.CALL_REJECT, { conversationId });
  },
  end(conversationId: string) {
    getSocket()?.emit(SOCKET_EVENTS.CALL_END, { conversationId });
  },
  // `signal` sera, une fois WebRTC branché, une offer/answer SDP ou un
  // candidat ICE — opaque pour ce module comme pour le serveur.
  sendSignal(conversationId: string, signal: unknown) {
    getSocket()?.emit(SOCKET_EVENTS.CALL_SIGNAL, { conversationId, signal });
  },
};
