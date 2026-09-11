import * as Crypto from "expo-crypto";
import nacl from "tweetnacl";

// TweetNaCl n'embarque pas de générateur d'aléa lui-même : il faut lui en
// fournir un explicitement. On branche ici le générateur natif sécurisé
// d'Expo (Keychain/Keystore sous-jacent selon la plateforme), disponible
// en Expo Go sans module custom. Cet import doit être fait UNE SEULE FOIS,
// au tout début de l'application (voir App.tsx).
let initialized = false;

export function initCrypto() {
  if (initialized) return;
  nacl.setPRNG((buffer, length) => {
    const randomBytes = Crypto.getRandomBytes(length);
    for (let i = 0; i < length; i++) {
      buffer[i] = randomBytes[i];
    }
  });
  initialized = true;
}
