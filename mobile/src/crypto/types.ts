// Types du module cryptographique de Shadow.
//
// Rappel de la règle absolue du cahier des charges : AUCUNE clé privée,
// AUCUN message en clair ne quitte jamais cet appareil. Tout ce qui sort
// vers le réseau (services/api, services/websocket) est déjà chiffré.

export interface KeyPair {
  publicKey: string; // base64
  secretKey: string; // base64 — ne quitte JAMAIS l'appareil
}

export interface IdentityKeyBundle {
  identityPublicKey: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKeys: { keyId: number; publicKey: string }[];
}

// Bundle public récupéré depuis le serveur pour initier une session avec
// UN appareil précis d'un autre utilisateur (X3DH simplifié).
export interface RemoteDeviceBundle {
  deviceId: string;
  userId: string;
  identityPublicKey: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKey: { keyId: number; publicKey: string } | null;
}

export interface EncryptedEnvelope {
  encryptedPayload: string; // base64
  nonce: string; // base64
  encryptionVersion: number;
}

export interface DeviceSecrets {
  identityKeyPair: KeyPair;
  signedPreKeyPair: KeyPair;
  oneTimePreKeyPairs: { keyId: number; keyPair: KeyPair }[];
}
