import { sessionStore } from "./sessionStore";
import { keyManager } from "./keyManager";
import { initiateSession, receiveSession } from "./session";
import { encryptMessage, decryptMessage } from "./message";
import { devicesApi } from "../services/api";
import type { EncryptedEnvelope } from "./types";

// Point d'entrée unique utilisé par les écrans : ils ne manipulent jamais
// directement les clés ou les nonces, seulement du texte en clair en entrée
// et en sortie. Tout le reste (établissement de session, dérivation,
// chiffrement) est encapsulé ici.

export interface OutgoingEncryptedMessage extends EncryptedEnvelope {
  senderEphemeralPublicKey?: string;
  usedOneTimePreKeyId?: number;
}

interface EnsuredSession {
  sharedKey: Uint8Array;
  bootstrap?: { senderEphemeralPublicKey: string; usedOneTimePreKeyId?: number };
}

// Garantit qu'une session existe avec cet appareil distant (l'établit si
// besoin) et retourne la clé partagée. Utilisé à la fois pour chiffrer du
// texte et pour chiffrer une pièce jointe avec la MÊME clé de session.
export async function ensureSessionKey(remoteDeviceId: string): Promise<EnsuredSession> {
  const existingKey = await sessionStore.load(remoteDeviceId);
  if (existingKey) return { sharedKey: existingKey };

  const bundle = await devicesApi.getBundle(remoteDeviceId);
  const session = initiateSession(bundle);
  await sessionStore.save(remoteDeviceId, session.sharedKey, session.ephemeralPublicKey);

  return {
    sharedKey: session.sharedKey,
    bootstrap: {
      senderEphemeralPublicKey: session.ephemeralPublicKey,
      usedOneTimePreKeyId: session.usedOneTimePreKeyId ?? undefined,
    },
  };
}

export async function encryptForDevice(remoteDeviceId: string, plainText: string): Promise<OutgoingEncryptedMessage> {
  const { sharedKey, bootstrap } = await ensureSessionKey(remoteDeviceId);
  const envelope = encryptMessage(plainText, sharedKey);
  return { ...envelope, ...bootstrap };
}

export async function decryptFromDevice(
  remoteDeviceId: string,
  envelope: EncryptedEnvelope,
  bootstrap?: { senderEphemeralPublicKey?: string; usedOneTimePreKeyId?: number },
): Promise<string> {
  let sharedKey = await sessionStore.load(remoteDeviceId);

  if (!sharedKey && bootstrap?.senderEphemeralPublicKey) {
    // Premier message reçu de cet appareil : on dérive la session à partir
    // de nos propres clés privées (signed prekey + one-time prekey utilisée
    // le cas échéant), jamais transmises au serveur.
    const secrets = await keyManager.loadSecrets();
    if (!secrets) throw new Error("Clés locales introuvables — réinstallation détectée ?");

    const oneTimePreKeyPair =
      bootstrap.usedOneTimePreKeyId !== undefined
        ? await keyManager.findOneTimePreKeyPair(bootstrap.usedOneTimePreKeyId)
        : undefined;

    sharedKey = receiveSession({
      ephemeralPublicKey: bootstrap.senderEphemeralPublicKey,
      signedPreKeyPair: secrets.signedPreKeyPair,
      oneTimePreKeyPair: oneTimePreKeyPair ?? undefined,
    });
    await sessionStore.save(remoteDeviceId, sharedKey);
  }

  if (!sharedKey) {
    throw new Error("SESSION_INTROUVABLE");
  }

  return decryptMessage(envelope, sharedKey);
}
