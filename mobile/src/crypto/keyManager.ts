import { generateDeviceSecrets } from "./keys";
import { secureStorage } from "../storage/secureStorage";
import type { DeviceSecrets, IdentityKeyBundle } from "./types";

// Point d'entrée unique pour tout ce qui touche aux clés de CET appareil.
// Le reste de l'app ne manipule jamais directement les clés privées.

export const keyManager = {
  async hasLocalKeys(): Promise<boolean> {
    const identity = await secureStorage.getJSON(secureStorage.KEYS.identityKeyPair);
    return identity !== null;
  },

  // Appelé UNE SEULE FOIS, à la création du compte ou au premier login sur
  // ce nouvel appareil. Retourne le bundle public à envoyer au serveur ;
  // les clés privées restent sur l'appareil, jamais transmises.
  async generateAndPersist(): Promise<IdentityKeyBundle> {
    const { secrets, publicBundle } = generateDeviceSecrets(50);
    await secureStorage.setJSON(secureStorage.KEYS.identityKeyPair, secrets.identityKeyPair);
    await secureStorage.setJSON(secureStorage.KEYS.signedPreKeyPair, secrets.signedPreKeyPair);
    await secureStorage.setJSON(secureStorage.KEYS.oneTimePreKeyPairs, secrets.oneTimePreKeyPairs);
    return publicBundle;
  },

  async loadSecrets(): Promise<DeviceSecrets | null> {
    const identityKeyPair = await secureStorage.getJSON<DeviceSecrets["identityKeyPair"]>(
      secureStorage.KEYS.identityKeyPair,
    );
    const signedPreKeyPair = await secureStorage.getJSON<DeviceSecrets["signedPreKeyPair"]>(
      secureStorage.KEYS.signedPreKeyPair,
    );
    const oneTimePreKeyPairs = await secureStorage.getJSON<DeviceSecrets["oneTimePreKeyPairs"]>(
      secureStorage.KEYS.oneTimePreKeyPairs,
    );
    if (!identityKeyPair || !signedPreKeyPair || !oneTimePreKeyPairs) return null;
    return { identityKeyPair, signedPreKeyPair, oneTimePreKeyPairs };
  },

  async findOneTimePreKeyPair(keyId: number) {
    const secrets = await this.loadSecrets();
    return secrets?.oneTimePreKeyPairs.find((k) => k.keyId === keyId)?.keyPair ?? null;
  },

  // Sécurité : à appeler lors de la révocation volontaire de cet appareil
  // (l'utilisateur clique "Déconnecter cet appareil" dans un autre client).
  async wipeLocalKeys() {
    await secureStorage.clearAll();
  },
};
