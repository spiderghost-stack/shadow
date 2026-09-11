import nacl from "tweetnacl";
import { b64 } from "./encoding";
import { verifySignedPreKey } from "./keys";
import type { KeyPair, RemoteDeviceBundle } from "./types";

// --------------------------------------------------------------------
// Établissement de session — variante simplifiée de X3DH.
//
// Limite assumée pour ce MVP (à documenter au client / roadmap V2) :
// la clé de session est statique par paire d'appareils, renouvelée à
// chaque nouvel appairage, mais PAS re-dérivée à chaque message (pas de
// Double Ratchet). Cela reste un chiffrement de bout en bout réel avec
// authentification du prekey, mais sans la forward secrecy "par message"
// qu'offre le Double Ratchet complet — amélioration prévue en V2.
// --------------------------------------------------------------------

export interface OutgoingSession {
  sharedKey: Uint8Array; // clé symétrique dérivée, 32 octets
  ephemeralPublicKey: string; // à joindre au premier message pour que le destinataire puisse dériver la même clé
  usedOneTimePreKeyId: number | null;
}

function deriveKey(dh1: Uint8Array, dh2: Uint8Array | null): Uint8Array {
  // KDF simple par hachage SHA-512 (nacl.hash) de la concaténation des
  // secrets Diffie-Hellman, tronqué à 32 octets pour secretbox.
  const material = dh2 ? new Uint8Array([...dh1, ...dh2]) : dh1;
  return nacl.hash(material).slice(0, 32);
}

// Alice initie une session vers un appareil précis de Bob.
export function initiateSession(remoteBundle: RemoteDeviceBundle): OutgoingSession {
  const validSignature = verifySignedPreKey(
    remoteBundle.identityPublicKey,
    remoteBundle.signedPreKeyPublic,
    remoteBundle.signedPreKeySignature,
  );
  if (!validSignature) {
    // Le prekey n'est pas authentifié par la clé d'identité annoncée :
    // possible tentative de substitution de clé par le serveur. On refuse.
    throw new Error("SIGNATURE_PREKEY_INVALIDE");
  }

  const ephemeral = nacl.box.keyPair();
  const signedPreKeyPub = b64.decode(remoteBundle.signedPreKeyPublic);

  const dh1 = nacl.box.before(signedPreKeyPub, ephemeral.secretKey);
  let dh2: Uint8Array | null = null;
  if (remoteBundle.oneTimePreKey) {
    const oneTimePub = b64.decode(remoteBundle.oneTimePreKey.publicKey);
    dh2 = nacl.box.before(oneTimePub, ephemeral.secretKey);
  }

  return {
    sharedKey: deriveKey(dh1, dh2),
    ephemeralPublicKey: b64.encode(ephemeral.publicKey),
    usedOneTimePreKeyId: remoteBundle.oneTimePreKey?.keyId ?? null,
  };
}

// Bob reçoit le premier message d'Alice et recalcule la même clé à partir
// de ses propres clés privées (signed prekey + one-time prekey utilisée).
export function receiveSession(params: {
  ephemeralPublicKey: string;
  signedPreKeyPair: KeyPair;
  oneTimePreKeyPair?: KeyPair;
}): Uint8Array {
  const ephemeralPub = b64.decode(params.ephemeralPublicKey);
  const signedSecret = b64.decode(params.signedPreKeyPair.secretKey);

  const dh1 = nacl.box.before(ephemeralPub, signedSecret);
  let dh2: Uint8Array | null = null;
  if (params.oneTimePreKeyPair) {
    const oneTimeSecret = b64.decode(params.oneTimePreKeyPair.secretKey);
    dh2 = nacl.box.before(ephemeralPub, oneTimeSecret);
  }

  return deriveKey(dh1, dh2);
}
