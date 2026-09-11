import React, { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Users } from "lucide-react-native";
import { useTheme } from "../theme";
import { Avatar, ListItem, ScreenHeader } from "../components";
import { Input } from "../components/Input";
import { conversationsApi, usersApi } from "../services/api";

export function NewConversationScreen({ navigation }: any) {
  const { colors, spacing, typography, fontFamily } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 1) {
      setResults([]);
      return;
    }
    const users = await usersApi.search(text.trim());
    setResults(users);
  }

  async function startConversation(userId: string, displayName: string) {
    const conversation = await conversationsApi.createDirect(userId);
    navigation.replace("Chat", { conversationId: conversation.id, title: displayName, otherUserId: userId });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Nouvelle discussion" onBack={() => navigation.goBack()} />

      <Pressable
        onPress={() => navigation.navigate("NewGroup")}
        style={{ flexDirection: "row", alignItems: "center", padding: spacing.md }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: spacing.sm }}>
          <Users size={20} color={colors.accent} />
        </View>
        <Text style={[typography.body, { color: colors.accent, fontFamily: fontFamily.medium }]}>Créer un groupe</Text>
      </Pressable>

      <View style={{ paddingHorizontal: spacing.md }}>
        <Input placeholder="Rechercher un nom d'utilisateur" autoCapitalize="none" value={query} onChangeText={handleSearch} />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListItem
            title={item.displayName}
            subtitle={`@${item.username}`}
            left={<Avatar name={item.displayName} uri={item.avatarUrl} />}
            onPress={() => startConversation(item.id, item.displayName)}
          />
        )}
      />
    </View>
  );
}
