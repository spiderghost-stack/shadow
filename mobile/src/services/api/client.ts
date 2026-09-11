import axios from "axios";
import { secureStorage } from "../../storage/secureStorage";

// Adresse du backend : à adapter (IP locale de votre machine pour Expo Go,
// ex. http://192.168.1.20:4000 — "localhost" ne fonctionne pas depuis un
// téléphone physique connecté au même Wi-Fi).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getString(secureStorage.KEYS.accessToken);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.getString(secureStorage.KEYS.refreshToken);
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
    await secureStorage.setString(secureStorage.KEYS.accessToken, data.accessToken);
    await secureStorage.setString(secureStorage.KEYS.refreshToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    // Refresh impossible -> session définitivement expirée, l'app devra
    // rediriger vers l'écran de connexion (géré par le store d'auth).
    await secureStorage.remove(secureStorage.KEYS.accessToken);
    await secureStorage.remove(secureStorage.KEYS.refreshToken);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
