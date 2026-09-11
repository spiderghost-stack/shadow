import * as SecureStore from "expo-secure-store";

// Toutes les clés PRIVÉES de l'appareil transitent uniquement par ce module.
// expo-secure-store s'appuie sur Keychain (iOS) / Keystore (Android) —
// jamais de stockage en clair dans AsyncStorage pour ces valeurs.

const KEYS = {
  identityKeyPair: "shadow.identityKeyPair",
  signedPreKeyPair: "shadow.signedPreKeyPair",
  oneTimePreKeyPairs: "shadow.oneTimePreKeyPairs",
  deviceId: "shadow.deviceId",
  accessToken: "shadow.accessToken",
  refreshToken: "shadow.refreshToken",
} as const;

async function setJSON(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export const secureStorage = {
  KEYS,
  setJSON,
  getJSON,
  setString: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  getString: (key: string) => SecureStore.getItemAsync(key),
  remove: (key: string) => SecureStore.deleteItemAsync(key),

  // Purge complète : utilisée lors d'une déconnexion "révoquer cet appareil"
  // ou d'une réinitialisation volontaire des clés.
  async clearAll() {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
  },
};
