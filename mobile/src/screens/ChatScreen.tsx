import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Send, Image as ImageIcon, Timer, MoreVertical, Search, Phone, Video } from "lucide-react-native";
import { useTheme } from "../theme";
import { ScreenHeader } from "../components";
import { Input } from "../components/Input";
import { MessageBubble } from "../components/MessageBubble";
import { AttachmentImage } from "../components/AttachmentImage";
import { useChat } from "../hooks/useChat";
import { useAuthStore } from "../hooks/useAuthStore";
import { moderationApi, conversationsApi } from "../services/api";
import { getSocket, SOCKET_EVENTS } from "../services/websocket/socket";

const EPHEMERAL_OPTIONS: { label: string; seconds?: number }[] = [
  { label: "Désactivé", seconds: undefined },
  { label: "10 s", seconds: 10 },
  { label: "1 min", seconds: 60 },
  { label: "1 h", seconds: 3600 },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const { colors, spacing, typography, fontFamily } = useTheme();
  const myUserId = useAuthStore((s) => s.user?.id) ?? "";
  const [title, setTitle] = useState<string>(route.params.title ?? "Conversation");
  const [otherUserId, setOtherUserId] = useState<string | undefined>(route.params.otherUserId);
  const { messages, send, sendImage, sending, editMessage, deleteMessage } = useChat(conversationId, otherUserId ?? "", myUserId);
  const [text, setText] = useState("");
  const [ephemeralIndex, setEphemeralIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    // Cas d'ouverture depuis une notification push : on ne connaît que
    // conversationId (le contenu du message n'a jamais transité par la
    // notification). On récupère titre et interlocuteur nous-mêmes.
    if (otherUserId) return;
    conversationsApi.getDetail(conversationId).then((conversation: any) => {
      const other = conversation.members.find((m: any) => m.userId !== myUserId);
      if (other) {
        setOtherUserId(other.userId);
        setTitle(conversation.type === "group" ? conversation.name ?? "Groupe" : other.user.displayName);
      }
    });
  }, [conversationId, otherUserId, myUserId]);

  useEffect(() => {
    const socket = getSocket();
    const onInvite = ({ conversationId: cid, callType }: any) => {
      if (cid !== conversationId) return;
      navigation.navigate("Call", { conversationId, otherUserName: title, callType, isIncoming: true });
    };
    socket?.on(SOCKET_EVENTS.CALL_INVITE, onInvite);
    return () => {
      socket?.off(SOCKET_EVENTS.CALL_INVITE, onInvite);
    };
  }, [conversationId, title, navigation]);

  function startCall(callType: "audio" | "video") {
    navigation.navigate("Call", { conversationId, otherUserName: title, callType, isIncoming: false });
  }

  const ephemeralSeconds = EPHEMERAL_OPTIONS[ephemeralIndex].seconds;

  async function handleSend() {
    const value = text;
    setText("");
    if (editingId) {
      await editMessage(editingId, value);
      setEditingId(null);
      return;
    }
    await send(value, ephemeralSeconds);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  function handleLongPressMessage(item: any) {
    if (!item.outgoing || item.attachment) return; // édition/suppression réservées à nos propres messages texte
    Alert.alert("Message", undefined, [
      {
        text: "Modifier",
        onPress: () => {
          setEditingId(item.id);
          setText(item.text);
        },
      },
      {
        text: "Supprimer pour tout le monde",
        style: "destructive",
        onPress: () => deleteMessage(item.id),
      },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    await sendImage(asset.uri, asset.mimeType ?? "image/jpeg");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  function cycleEphemeral() {
    setEphemeralIndex((i) => (i + 1) % EPHEMERAL_OPTIONS.length);
  }

  function openOptions() {
    if (!otherUserId) return; // pas encore résolu (ouverture depuis une notification, chargement en cours)
    Alert.alert(title, undefined, [
      {
        text: "Infos de la conversation",
        onPress: () => navigation.navigate("ConversationInfo", { conversationId }),
      },
      {
        text: "Bloquer cet utilisateur",
        style: "destructive",
        onPress: () =>
          Alert.alert("Bloquer", `Bloquer ${title} ? Vous ne recevrez plus ses messages.`, [
            { text: "Annuler", style: "cancel" },
            {
              text: "Bloquer",
              style: "destructive",
              onPress: async () => {
                await moderationApi.block(otherUserId);
                navigation.goBack();
              },
            },
          ]),
      },
      {
        text: "Signaler",
        onPress: () =>
          Alert.alert("Signaler", "Motif du signalement", [
            { text: "Annuler", style: "cancel" },
            { text: "Spam", onPress: () => moderationApi.report(otherUserId, "spam") },
            { text: "Harcèlement", onPress: () => moderationApi.report(otherUserId, "harassment") },
            { text: "Autre", onPress: () => moderationApi.report(otherUserId, "other") },
          ]),
      },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
      <ScreenHeader
        title={title}
        onBack={() => navigation.goBack()}
        right={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => startCall("audio")} hitSlop={10} style={{ marginRight: 16 }}>
              <Phone size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => startCall("video")} hitSlop={10} style={{ marginRight: 16 }}>
              <Video size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate("MessageSearch", { messages, title })} hitSlop={10} style={{ marginRight: 16 }}>
              <Search size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={openOptions} hitSlop={10}>
              <MoreVertical size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        }
      />

      {editingId ? (
        <View style={[styles.ephemeralBanner, { backgroundColor: colors.surface, paddingVertical: 4, paddingHorizontal: spacing.md, justifyContent: "space-between" }]}>
          <Text style={[typography.caption, { color: colors.accent, fontFamily: fontFamily.regular }]}>Modification du message</Text>
          <Pressable onPress={() => { setEditingId(null); setText(""); }}>
            <Text style={[typography.caption, { color: colors.danger, fontFamily: fontFamily.medium }]}>Annuler</Text>
          </Pressable>
        </View>
      ) : null}

      {ephemeralSeconds && !editingId ? (
        <View style={[styles.ephemeralBanner, { backgroundColor: colors.surface, paddingVertical: 4, paddingHorizontal: spacing.md }]}>
          <Timer size={13} color={colors.warning} />
          <Text style={[typography.caption, { color: colors.warning, marginLeft: 6, fontFamily: fontFamily.regular }]}>
            Messages éphémères activés ({EPHEMERAL_OPTIONS[ephemeralIndex].label})
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: spacing.md }}
        renderItem={({ item }) => (
          <View>
            {item.attachment?.fileType === "image" ? (
              <View style={{ alignItems: item.outgoing ? "flex-end" : "flex-start", paddingHorizontal: 12, marginBottom: 4 }}>
                <AttachmentImage
                  storageUrl={item.attachment.storageUrl}
                  encryptionNonce={item.attachment.encryptionNonce}
                  remoteDeviceId={item.remoteDeviceId}
                  localPreviewUri={item.localPreviewUri}
                />
              </View>
            ) : null}
            {item.text || item.decryptionFailed ? (
              <Pressable onLongPress={() => handleLongPressMessage(item)}>
                <MessageBubble
                  text={item.text}
                  outgoing={item.outgoing}
                  status={item.status as any}
                  time={formatTime(item.createdAt)}
                  decryptionFailed={item.decryptionFailed}
                />
              </Pressable>
            ) : null}
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={[styles.inputRow, { padding: spacing.sm, borderTopColor: colors.border }]}>
        <Pressable onPress={handlePickImage} style={styles.iconButton} hitSlop={8}>
          <ImageIcon size={22} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={cycleEphemeral} style={styles.iconButton} hitSlop={8}>
          <Timer size={22} color={ephemeralSeconds ? colors.warning : colors.textSecondary} />
        </Pressable>

        <View style={{ flex: 1, marginBottom: 0 }}>
          <Input placeholder="Message" value={text} onChangeText={setText} multiline style={{ maxHeight: 100 }} />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={[styles.sendButton, { backgroundColor: colors.accent, opacity: sending || !text.trim() ? 0.5 : 1 }]}
        >
          <Send size={18} color={colors.accentText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderTopWidth: StyleSheet.hairlineWidth },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 8, marginBottom: 12 },
  iconButton: { width: 36, height: 40, alignItems: "center", justifyContent: "center" },
  ephemeralBanner: { flexDirection: "row", alignItems: "center" },
});
