import nacl from "tweetnacl";
import { b64, utf8 } from "./encoding";
import type { EncryptedEnvelope } from "./types";

// Chiffrement authentifié XSalsa20-Poly1305 (nacl.secretbox). Un nonce
// ALÉATOIRE et UNIQUE est généré à chaque message — jamais réutilisé avec
// la même clé (règle cryptographique stricte, sans quoi la confidentialité
// s'effondre). Le serveur ne voit que `encryptedPayload` + `nonce`.

export function encryptMessage(plainText: string, sharedKey: Uint8Array): EncryptedEnvelope {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = utf8.encode(plainText);
  const box = nacl.secretbox(messageBytes, nonce, sharedKey);

  return {
    encryptedPayload: b64.encode(box),
    nonce: b64.encode(nonce),
    encryptionVersion: 1,
  };
}

export function decryptMessage(envelope: EncryptedEnvelope, sharedKey: Uint8Array): string {
  const box = b64.decode(envelope.encryptedPayload);
  const nonce = b64.decode(envelope.nonce);
  const opened = nacl.secretbox.open(box, nonce, sharedKey);

  if (!opened) {
    // Échec d'authentification : message altéré en transit, mauvaise clé,
    // ou tentative de manipulation. On ne renvoie jamais un texte partiel.
    throw new Error("DECHIFFREMENT_ECHOUE");
  }
  return utf8.decode(opened);
}

// Chiffrement d'une pièce jointe (binaire) — même principe, appliqué avant
// l'upload. Le serveur ne stocke que le blob déjà chiffré.
export function encryptAttachment(data: Uint8Array, sharedKey: Uint8Array) {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(data, nonce, sharedKey);
  return { encryptedData: box, nonce: b64.encode(nonce) };
}

export function decryptAttachment(encryptedData: Uint8Array, nonce: string, sharedKey: Uint8Array) {
  const opened = nacl.secretbox.open(encryptedData, b64.decode(nonce), sharedKey);
  if (!opened) throw new Error("DECHIFFREMENT_PIECE_JOINTE_ECHOUE");
  return opened;
}
