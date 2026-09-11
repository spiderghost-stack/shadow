import { z } from "zod";

export const createConversationSchema = z.object({
  body: z.object({
    type: z.enum(["direct", "group"]),
    name: z.string().min(1).max(64).optional(),
    memberIds: z.array(z.string().uuid()).min(1).max(256),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listMessagesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ conversationId: z.string().uuid() }),
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

// Le serveur ne reçoit JAMAIS de texte en clair : uniquement un blob chiffré
// + son nonce, déjà produits par le client (voir mobile/src/crypto).
export const sendMessageSchema = z.object({
  body: z.object({
    clientMessageId: z.string().uuid(), // pour la déduplication / accusés offline
    type: z.enum(["text", "image", "file", "voice"]).default("text"),
    encryptedPayload: z.string().min(1),
    nonce: z.string().min(1),
    encryptionVersion: z.number().int().default(1),
    // Présents uniquement sur le message qui établit une nouvelle session
    // (X3DH) — clés PUBLIQUES, non secrètes.
    senderEphemeralPublicKey: z.string().optional(),
    usedOneTimePreKeyId: z.number().int().optional(),
    replyToId: z.string().uuid().optional(),
    ephemeralSeconds: z.number().int().positive().optional(),
    attachments: z
      .array(
        z.object({
          fileType: z.enum(["image", "file", "voice"]),
          mimeType: z.string().optional(),
          sizeBytes: z.number().int().positive(),
          storageUrl: z.string().min(1),
          encryptionNonce: z.string().min(1),
          checksumSha256: z.string().optional(),
        }),
      )
      .optional(),
  }),
  params: z.object({ conversationId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const editMessageSchema = z.object({
  body: z.object({ encryptedPayload: z.string().min(1), nonce: z.string().min(1) }),
  params: z.object({ messageId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const markReadSchema = z.object({
  body: z.object({ messageIds: z.array(z.string().uuid()).min(1).max(200) }),
  params: z.object({ conversationId: z.string().uuid() }),
  query: z.object({}).optional(),
});
