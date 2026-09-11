import * as SecureStore from "expo-secure-store";
import { b64 } from "./encoding";

// Une clé de session par appareil DISTANT (pas par conversation : dans une
// conversation de groupe, chaque appareil de chaque membre a sa propre
// session E2E avec chacun des appareils de l'utilisateur courant).
// Stockée de façon sécurisée, jamais en clair, jamais envoyée au serveur.

function storageKey(remoteDeviceId: string) {
  return `shadow.session.${remoteDeviceId}`;
}

export const sessionStore = {
  async save(remoteDeviceId: string, sharedKey: Uint8Array, ephemeralPublicKey?: string) {
    await SecureStore.setItemAsync(
      storageKey(remoteDeviceId),
      JSON.stringify({ sharedKey: b64.encode(sharedKey), ephemeralPublicKey }),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED },
    );
  },

  async load(remoteDeviceId: string): Promise<Uint8Array | null> {
    const raw = await SecureStore.getItemAsync(storageKey(remoteDeviceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sharedKey: string };
    return b64.decode(parsed.sharedKey);
  },

  async has(remoteDeviceId: string): Promise<boolean> {
    return (await SecureStore.getItemAsync(storageKey(remoteDeviceId))) !== null;
  },

  async remove(remoteDeviceId: string) {
    await SecureStore.deleteItemAsync(storageKey(remoteDeviceId));
  },
};
