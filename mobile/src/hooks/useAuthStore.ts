import { create } from "zustand";
import { Platform } from "react-native";
import { authApi } from "../services/api/auth.api";
import { usersApi } from "../services/api";
import { secureStorage } from "../storage/secureStorage";
import { keyManager } from "../crypto/keyManager";
import { disconnectSocket } from "../services/websocket/socket";
import { registerForPushNotifications } from "../services/notifications";

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  deviceId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
  register: (params: { username: string; displayName: string; password: string }) => Promise<void>;
  login: (params: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

async function buildRegisterDevicePayload() {
  const publicBundle = await keyManager.generateAndPersist();
  return {
    ...publicBundle,
    deviceName: Platform.OS === "ios" ? "iPhone" : "Téléphone Android",
    deviceType: "mobile" as const,
    platform: (Platform.OS === "ios" ? "ios" : "android") as "ios" | "android",
  };
}

// Au login, si cet appareil est déjà connu (clés + deviceId en stockage
// sécurisé), on ne renvoie que son id — pas de nouvelles clés à chaque
// connexion. Sinon (nouveau téléphone), on génère un jeu de clés complet.
async function buildLoginPayload() {
  const knownDeviceId = await secureStorage.getString(secureStorage.KEYS.deviceId);
  const hasKeys = await keyManager.hasLocalKeys();

  if (knownDeviceId && hasKeys) {
    return { deviceId: knownDeviceId };
  }
  return { device: await buildRegisterDevicePayload() };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  deviceId: null,
  status: "idle",
  errorMessage: null,

  async register({ username, displayName, password }) {
    set({ status: "loading", errorMessage: null });
    try {
      const device = await buildRegisterDevicePayload();
      const result = await authApi.register({ username, displayName, password, device });
      await secureStorage.setString(secureStorage.KEYS.accessToken, result.accessToken);
      await secureStorage.setString(secureStorage.KEYS.refreshToken, result.refreshToken);
      await secureStorage.setString(secureStorage.KEYS.deviceId, result.deviceId);
      set({ user: result.user, deviceId: result.deviceId, status: "ready" });
      registerForPushNotifications();
    } catch (err: any) {
      set({ status: "error", errorMessage: err?.response?.data?.error?.message ?? "Inscription impossible." });
      throw err;
    }
  },

  async login({ username, password }) {
    set({ status: "loading", errorMessage: null });
    try {
      const payload = await buildLoginPayload();
      const result = await authApi.login({ username, password, ...payload });
      await secureStorage.setString(secureStorage.KEYS.accessToken, result.accessToken);
      await secureStorage.setString(secureStorage.KEYS.refreshToken, result.refreshToken);
      await secureStorage.setString(secureStorage.KEYS.deviceId, result.deviceId);
      set({ user: result.user, deviceId: result.deviceId, status: "ready" });
      registerForPushNotifications();
    } catch (err: any) {
      set({ status: "error", errorMessage: err?.response?.data?.error?.message ?? "Connexion impossible." });
      throw err;
    }
  },

  async logout() {
    const refreshToken = await secureStorage.getString(secureStorage.KEYS.refreshToken);
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
    disconnectSocket();
    await secureStorage.remove(secureStorage.KEYS.accessToken);
    await secureStorage.remove(secureStorage.KEYS.refreshToken);
    // Note : on NE supprime PAS les clés de chiffrement locales ici (elles
    // restent nécessaires pour déchiffrer l'historique local au prochain
    // login sur ce même appareil). Elles ne sont effacées que par
    // keyManager.wipeLocalKeys(), appelé sur révocation explicite.
    set({ user: null, deviceId: null, status: "idle" });
  },

  async restore() {
    const token = await secureStorage.getString(secureStorage.KEYS.accessToken);
    const deviceId = await secureStorage.getString(secureStorage.KEYS.deviceId);
    if (!token || !deviceId) {
      set({ status: "idle" });
      return;
    }
    try {
      const user = await usersApi.me();
      set({ user, deviceId, status: "ready" });
      registerForPushNotifications();
    } catch {
      set({ status: "idle" });
    }
  },
}));
