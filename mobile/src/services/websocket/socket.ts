import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/client";
import { secureStorage } from "../../storage/secureStorage";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await secureStorage.getString(secureStorage.KEYS.accessToken);
  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
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
  CALL_INVITE: "call:invite",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_SIGNAL: "call:signal",
} as const;
