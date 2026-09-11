import argon2 from "argon2";

// Argon2id : recommandé OWASP pour le hachage de mots de passe.
// Le mot de passe en clair ne transite jamais au-delà de cette fonction
// et n'est jamais journalisé (voir utils/logger.ts).
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    // Hash corrompu/format inconnu -> échec silencieux, jamais d'exception qui fuite.
    return false;
  }
}
