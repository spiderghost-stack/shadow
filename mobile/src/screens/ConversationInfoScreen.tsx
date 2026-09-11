import React, { useEffect, useState } from "react";
import { Alert, FlatList, Switch, Text, View } from "react-native";
import { UserPlus, UserMinus } from "lucide-react-native";
import { useTheme } from "../theme";
import { Avatar, ListItem, ScreenHeader } from "../components";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { conversationsApi, usersApi } from "../services/api";
import { useAuthStore } from "../hooks/useAuthStore";

export function ConversationInfoScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const { colors, spacing, typography, fontFamily } = useTheme();
  const myUserId = useAuthStore((s) => s.user?.id);

  const [conversation, setConversation] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function refresh() {
    const data = await conversationsApi.getDetail(conversationId);
    setConversation(data);
    const me = data.members.find((m: any) => m.userId === myUserId);
    setMuted(!!me?.mutedUntil);
  }

  useEffect(() => {
    refresh();
  }, [conversationId]);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 1) {
      setResults([]);
      return;
    }
    setResults(await usersApi.search(text.trim()));
  }

  async function addMember(userId: string) {
    await conversationsApi.addMembers(conversationId, [userId]);
    setQuery("");
    setResults([]);
    refresh();
  }

  async function removeMember(userId: string) {
    await conversationsApi.removeMember(conversationId, userId);
    refresh();
  }

  async function toggleMute(value: boolean) {
    setMuted(value);
    const mutedUntil = value ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;
    await conversationsApi.mute(conversationId, mutedUntil);
  }

  function handleLeave() {
    Alert.alert("Quitter le groupe", "Confirmer ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          await conversationsApi.leave(conversationId);
          navigation.popToTop();
        },
      },
    ]);
  }

  if (!conversation) return null;

  const isGroup = conversation.type === "group";
  const myMembership = conversation.members.find((m: any) => m.userId === myUserId);
  const isAdmin = myMembership?.role === "admin";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isGroup ? conversation.name ?? "Groupe" : "Infos"} onBack={() => navigation.goBack()} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary, fontFamily: fontFamily.medium }]}>
          Notifications en sourdine
        </Text>
        <Switch value={muted} onValueChange={toggleMute} trackColor={{ true: colors.accent, false: colors.surfaceAlt }} />
      </View>

      {isGroup ? (
        <>
          <Text style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.xs, fontFamily: fontFamily.regular }]}>
            MEMBRES ({conversation.members.length})
          </Text>
          <FlatList
            data={conversation.members}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <ListItem
                title={item.user.displayName}
                subtitle={item.role === "admin" ? "Administrateur" : undefined}
                left={<Avatar name={item.user.displayName} uri={item.user.avatarUrl} />}
                right={
                  isAdmin && item.userId !== myUserId ? (
                    <UserMinus size={18} color={colors.danger} onPress={() => removeMember(item.userId)} />
                  ) : undefined
                }
              />
            )}
          />

          {isAdmin ? (
            <View style={{ padding: spacing.md }}>
              <Input placeholder="Ajouter un membre" autoCapitalize="none" value={query} onChangeText={handleSearch} />
              {results.map((u) => (
                <ListItem
                  key={u.id}
                  title={u.displayName}
                  subtitle={`@${u.username}`}
                  left={<Avatar name={u.displayName} uri={u.avatarUrl} />}
                  right={<UserPlus size={18} color={colors.accent} />}
                  onPress={() => addMember(u.id)}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={{ padding: spacing.md, marginTop: "auto" }}>
        <Button
          label={isGroup ? "Quitter le groupe" : "Quitter la conversation"}
          variant="danger"
          onPress={handleLeave}
        />
      </View>
    </View>
  );
}
