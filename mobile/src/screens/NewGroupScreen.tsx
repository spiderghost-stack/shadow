import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useTheme } from "../theme";
import { Avatar, ListItem, ScreenHeader } from "../components";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { conversationsApi, usersApi } from "../services/api";

export function NewGroupScreen({ navigation }: any) {
  const { colors, spacing, typography, fontFamily } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<Map<string, string>>(new Map()); // id -> displayName
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 1) {
      setResults([]);
      return;
    }
    setResults(await usersApi.search(text.trim()));
  }

  function toggle(user: any) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user.displayName);
      return next;
    });
  }

  async function handleCreate() {
    if (selected.size < 1 || !groupName.trim()) return;
    setCreating(true);
    try {
      const conversation = await conversationsApi.createGroup(groupName.trim(), Array.from(selected.keys()));
      navigation.replace("Chat", { conversationId: conversation.id, title: groupName.trim() });
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Nouveau groupe" onBack={() => navigation.goBack()} />

      <View style={{ padding: spacing.md }}>
        <Input label="Nom du groupe" value={groupName} onChangeText={setGroupName} />
        <Input placeholder="Ajouter des membres" autoCapitalize="none" value={query} onChangeText={handleSearch} />

        {selected.size > 0 ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm, fontFamily: fontFamily.regular }]}>
            {Array.from(selected.values()).join(", ")}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListItem
            title={item.displayName}
            subtitle={`@${item.username}`}
            left={<Avatar name={item.displayName} uri={item.avatarUrl} />}
            right={selected.has(item.id) ? <Check size={18} color={colors.accent} /> : undefined}
            onPress={() => toggle(item)}
          />
        )}
      />

      <View style={{ padding: spacing.md }}>
        <Button
          label={`Créer le groupe (${selected.size} membre${selected.size > 1 ? "s" : ""})`}
          onPress={handleCreate}
          disabled={selected.size < 1 || !groupName.trim()}
          loading={creating}
        />
      </View>
    </View>
  );
}
