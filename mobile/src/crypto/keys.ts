import nacl from "tweetnacl";
import { b64 } from "./encoding";
import type { DeviceSecrets, IdentityKeyBundle, KeyPair } from "./types";

// Toute la cryptographie repose sur TweetNaCl (Bernstein et al.) : X25519
// pour l'échange de clés, Ed25519 pour la signature, XSalsa20-Poly1305 pour
// le chiffrement authentifié. Bibliothèque auditée, pas de crypto maison
// (règle explicite du cahier des charges).

function toKeyPair(kp: nacl.BoxKeyPair | nacl.SignKeyPair): KeyPair {
  return { publicKey: b64.encode(kp.publicKey), secretKey: b64.encode(kp.secretKey) };
}

// Clé d'identité : paire Ed25519 utilisée UNIQUEMENT pour signer/authentifier
// la signed prekey. Elle ne sert jamais directement à chiffrer un message.
export function generateIdentityKeyPair(): KeyPair {
  return toKeyPair(nacl.sign.keyPair());
}

// Signed prekey : paire X25519 utilisée pour l'échange de clés (DH), signée
// par la clé d'identité pour empêcher un serveur malveillant de substituer
// une fausse clé publique (protection contre le MITM au niveau du serveur).
export function generateSignedPreKey(identitySecretKey: string) {
  const boxKeyPair = nacl.box.keyPair();
  const secretKey = b64.decode(identitySecretKey);
  const signature = nacl.sign.detached(boxKeyPair.publicKey, secretKey);
  return {
    keyPair: toKeyPair(boxKeyPair),
    signature: b64.encode(signature),
  };
}

// Prekeys à usage unique : consommées une seule fois par le serveur lors de
// l'établissement d'une nouvelle session, jamais réutilisées.
export function generateOneTimePreKeys(count: number, startId = 0) {
  return Array.from({ length: count }, (_, i) => ({
    keyId: startId + i,
    keyPair: toKeyPair(nacl.box.keyPair()),
  }));
}

// Génère le jeu complet de clés nécessaires à l'enregistrement d'un nouvel
// appareil (appelé une seule fois, à l'installation).
export function generateDeviceSecrets(oneTimePreKeyCount = 50): {
  secrets: DeviceSecrets;
  publicBundle: Omit<IdentityKeyBundle, never>;
} {
  const identityKeyPair = generateIdentityKeyPair();
  const { keyPair: signedPreKeyPair, signature } = generateSignedPreKey(identityKeyPair.secretKey);
  const oneTimePreKeyPairs = generateOneTimePreKeys(oneTimePreKeyCount);

  return {
    secrets: { identityKeyPair, signedPreKeyPair, oneTimePreKeyPairs },
    publicBundle: {
      identityPublicKey: identityKeyPair.publicKey,
      signedPreKeyPublic: signedPreKeyPair.publicKey,
      signedPreKeySignature: signature,
      oneTimePreKeys: oneTimePreKeyPairs.map((k) => ({ keyId: k.keyId, publicKey: k.keyPair.publicKey })),
    },
  };
}

export function verifySignedPreKey(
  identityPublicKey: string,
  signedPreKeyPublic: string,
  signature: string,
): boolean {
  return nacl.sign.detached.verify(
    b64.decode(signedPreKeyPublic),
    b64.decode(signature),
    b64.decode(identityPublicKey),
  );
}
