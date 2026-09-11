import { useCallback, useEffect, useRef, useState } from "react";
import { messagesApi, usersApi } from "../services/api";
import { connectSocket, SOCKET_EVENTS } from "../services/websocket/socket";
import { decryptFromDevice, encryptForDevice, ensureSessionKey } from "../crypto/encryptedMessaging";
import { encryptMessage } from "../crypto/message";
import { encryptAndUploadFile } from "../crypto/attachmentFlow";

export interface DecryptedMessage {
  id: string;
  text: string;
  outgoing: boolean;
  senderId: string;
  status: string;
  createdAt: string;
  decryptionFailed?: boolean;
  attachment?: { storageUrl: string; encryptionNonce: string; mimeType?: string; fileType: string };
  ephemeralSeconds?: number | null;
  remoteDeviceId?: string;
  localPreviewUri?: string;
}

export function useChat(conversationId: string, otherUserId: string, myUserId: string) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const recipientDeviceIdRef = useRef<string | null>(null);

  const decryptIncoming = useCallback(
    async (raw: any): Promise<DecryptedMessage> => {
      const outgoing = raw.senderId === myUserId;
      const firstAttachment = raw.attachments?.[0]
        ? {
            storageUrl: raw.attachments[0].storageUrl,
            encryptionNonce: raw.attachments[0].encryptionNonce,
            mimeType: raw.attachments[0].mimeType,
            fileType: raw.attachments[0].fileType,
          }
        : undefined;
      try {
        const text = raw.encryptedPayload
          ? await decryptFromDevice(
              raw.senderDeviceId,
              { encryptedPayload: raw.encryptedPayload, nonce: raw.nonce, encryptionVersion: raw.encryptionVersion },
              { senderEphemeralPublicKey: raw.senderEphemeralPublicKey, usedOneTimePreKeyId: raw.usedOneTimePreKeyId },
            )
          : "";
        return {
          id: raw.id,
          text,
          outgoing,
          senderId: raw.senderId,
          status: raw.status,
          createdAt: raw.createdAt,
          attachment: firstAttachment,
          ephemeralSeconds: raw.ephemeralSeconds,
          // Limite MVP assumée : pour un message SORTANT relu après un
          // redémarrage de l'app, on ne connaît plus de façon fiable
          // quel appareil destinataire a été utilisé au moment de l'envoi
          // (le backend ne stocke que senderDeviceId = notre propre
          // appareil). Le déchiffrement de la pièce jointe n'est donc
          // garanti que pour les messages entrants, ou sortants envoyés
          // pendant la session en cours (voir ChatScreen).
          remoteDeviceId: outgoing ? undefined : raw.senderDeviceId,
        };
      } catch {
        return {
          id: raw.id,
          text: "",
          outgoing,
          senderId: raw.senderId,
          status: raw.status,
          createdAt: raw.createdAt,
          decryptionFailed: true,
          attachment: firstAttachment,
          remoteDeviceId: outgoing ? undefined : raw.senderDeviceId,
        };
      }
    },
    [myUserId],
  );

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await messagesApi.list(conversationId);
      const decrypted = await Promise.all(raw.reverse().map(decryptIncoming));
      setMessages(decrypted);
    } finally {
      setLoading(false);
    }
  }, [conversationId, decryptIncoming]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let active = true;
    (async () => {
      const socket = await connectSocket();
      socket.emit("conversation:join", { conversationId });
      socket.on(SOCKET_EVENTS.MESSAGE_NEW, async ({ message }: any) => {
        if (!active || message.conversationId !== conversationId) return;
        // Nos propres messages sont déjà affichés de façon optimiste au
        // moment de l'envoi (voir send/sendImage) — l'écho du serveur sur
        // notre propre room ne doit pas créer un doublon. Une vraie
        // déduplication par clientMessageId nécessiterait de le persister
        // côté serveur ; limite MVP assumée.
        if (message.senderId === myUserId) return;
        const decrypted = await decryptIncoming(message);
        setMessages((prev) => [...prev, decrypted]);
      });

      socket.on(SOCKET_EVENTS.MESSAGE_EDITED, async ({ message }: any) => {
        if (!active || message.conversationId !== conversationId || message.senderId === myUserId) return;
        const decrypted = await decryptIncoming(message);
        setMessages((prev) => prev.map((m) => (m.id === decrypted.id ? decrypted : m)));
      });

      socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId, conversationId: cid }: any) => {
        if (!active || cid !== conversationId) return;
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      });
    })();
    return () => {
      active = false;
    };
  }, [conversationId, decryptIncoming]);

  async function send(plainText: string, ephemeralSeconds?: number) {
    if (!plainText.trim()) return;
    setSending(true);
    try {
      if (!recipientDeviceIdRef.current) {
        recipientDeviceIdRef.current = await usersApi.getPrimaryDeviceId(otherUserId);
      }
      const envelope = await encryptForDevice(recipientDeviceIdRef.current, plainText.trim());
      const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimistic: DecryptedMessage = {
        id: clientMessageId,
        text: plainText.trim(),
        outgoing: true,
        senderId: myUserId,
        status: "sent",
        createdAt: new Date().toISOString(),
        ephemeralSeconds,
      };
      setMessages((prev) => [...prev, optimistic]);

      await messagesApi.send(conversationId, {
        clientMessageId,
        type: "text",
        encryptedPayload: envelope.encryptedPayload,
        nonce: envelope.nonce,
        encryptionVersion: envelope.encryptionVersion,
        senderEphemeralPublicKey: envelope.senderEphemeralPublicKey,
        usedOneTimePreKeyId: envelope.usedOneTimePreKeyId,
        ephemeralSeconds,
      });
    } finally {
      setSending(false);
    }
  }

  async function sendImage(localUri: string, mimeType: string) {
    setSending(true);
    try {
      if (!recipientDeviceIdRef.current) {
        recipientDeviceIdRef.current = await usersApi.getPrimaryDeviceId(otherUserId);
      }
      const { sharedKey, bootstrap } = await ensureSessionKey(recipientDeviceIdRef.current);
      const attachment = await encryptAndUploadFile({ localUri, mimeType, fileType: "image", sharedKey });
      const envelope = encryptMessage("", sharedKey);
      const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimistic: DecryptedMessage = {
        id: clientMessageId,
        text: "",
        outgoing: true,
        senderId: myUserId,
        status: "sent",
        createdAt: new Date().toISOString(),
        attachment: {
          storageUrl: attachment.storageUrl,
          encryptionNonce: attachment.encryptionNonce,
          mimeType: attachment.mimeType,
          fileType: attachment.fileType,
        },
        localPreviewUri: localUri,
      };
      setMessages((prev) => [...prev, optimistic]);

      await messagesApi.send(conversationId, {
        clientMessageId,
        type: "image",
        encryptedPayload: envelope.encryptedPayload,
        nonce: envelope.nonce,
        encryptionVersion: envelope.encryptionVersion,
        senderEphemeralPublicKey: bootstrap?.senderEphemeralPublicKey,
        usedOneTimePreKeyId: bootstrap?.usedOneTimePreKeyId,
        attachments: [
          {
            fileType: attachment.fileType,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            storageUrl: attachment.storageUrl,
            encryptionNonce: attachment.encryptionNonce,
            checksumSha256: attachment.checksumSha256,
          },
        ],
      });
    } finally {
      setSending(false);
    }
  }

  async function editMessage(messageId: string, newText: string) {
    if (!recipientDeviceIdRef.current) {
      recipientDeviceIdRef.current = await usersApi.getPrimaryDeviceId(otherUserId);
    }
    const { sharedKey } = await ensureSessionKey(recipientDeviceIdRef.current);
    const envelope = encryptMessage(newText.trim(), sharedKey);
    await messagesApi.edit(messageId, envelope.encryptedPayload, envelope.nonce);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text: newText.trim() } : m)));
  }

  async function deleteMessage(messageId: string) {
    await messagesApi.remove(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  return { messages, loading, sending, send, sendImage, editMessage, deleteMessage };
}
