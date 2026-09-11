import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Lock, SquarePen } from "lucide-react-native";
import { Pressable } from "react-native";
import { useTheme } from "../theme";
import { Avatar, ListItem, ScreenHeader } from "../components";
import { useConversations } from "../hooks/useConversations";
import { useAuthStore } from "../hooks/useAuthStore";

function conversationTitle(conversation: any, myUserId: string) {
  if (conversation.type === "group") return conversation.name ?? "Groupe";
  const other = conversation.members.find((m: any) => m.userId !== myUserId);
  return other?.user?.displayName ?? "Conversation";
}

export function ConversationsListScreen({ navigation }: any) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  const { conversations, loading, refresh } = useConversations();
  const myUserId = useAuthStore((s) => s.user?.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Discussions"
        right={
          <Pressable onPress={() => navigation.navigate("NewConversation")} hitSlop={12}>
            <SquarePen size={22} color={colors.accent} />
          </Pressable>
        }
      />

      <View style={[styles.banner, { backgroundColor: colors.surface, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }]}>
        <Lock size={13} color={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 6, fontFamily: fontFamily.regular }]}>
          Chiffrement de bout en bout activé
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
        renderItem={({ item }) => {
          const other = item.members.find((m: any) => m.userId !== myUserId);
          return (
            <ListItem
              title={conversationTitle(item, myUserId ?? "")}
              subtitle={item.messages?.[0] ? "Nouveau message chiffré" : "Aucun message pour le moment"}
              left={<Avatar name={conversationTitle(item, myUserId ?? "")} />}
              onPress={() =>
                navigation.navigate("Chat", {
                  conversationId: item.id,
                  title: conversationTitle(item, myUserId ?? ""),
                  otherUserId: other?.userId,
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <Text style={[typography.body, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                Aucune conversation pour l'instant.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center" },
});
