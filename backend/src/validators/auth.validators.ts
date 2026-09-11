import { z } from "zod";

// Le nom d'utilisateur sert UNIQUEMENT à identifier le compte, jamais
// comme clé cryptographique (règle explicite du cahier des charges : "NE PAS
// CONFONDRE IDENTIFIANT ET CLÉ").
const username = z
  .string()
  .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.")
  .max(32)
  .regex(/^[a-z0-9_.]+$/i, "Lettres, chiffres, '.' et '_' uniquement.");

const password = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .max(128);

// Clé publique de l'appareil : clé LONG TERME publique uniquement.
// La clé privée correspondante n'est jamais transmise (générée et conservée
// sur l'appareil, dans son stockage sécurisé).
const devicePublicKeyBundle = z.object({
  deviceName: z.string().min(1).max(64),
  deviceType: z.enum(["mobile", "tablet", "desktop"]),
  platform: z.enum(["android", "ios"]).optional(),
  identityPublicKey: z.string().min(32),
  signedPreKeyPublic: z.string().min(32),
  signedPreKeySignature: z.string().min(32),
  oneTimePreKeys: z
    .array(z.object({ keyId: z.number().int().nonnegative(), publicKey: z.string().min(32) }))
    .min(1)
    .max(200),
});

export const registerSchema = z.object({
  body: z.object({
    username,
    displayName: z.string().min(1).max(64),
    password,
    email: z.string().email().optional(),
    device: devicePublicKeyBundle,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    username,
    password,
    // Cas 1 — appareil déjà enregistré (reconnexion normale) : on renvoie
    // seulement son id, pas de nouvelles clés.
    deviceId: z.string().uuid().optional(),
    // Cas 2 — nouvel appareil (première connexion sur ce téléphone, ou
    // réinstallation) : bundle de clés complet requis.
    device: devicePublicKeyBundle.optional(),
  }).refine((data) => data.deviceId || data.device, {
    message: "Fournir soit deviceId (appareil connu), soit device (nouvel appareil).",
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
