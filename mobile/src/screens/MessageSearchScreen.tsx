import React, { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Search as SearchIcon } from "lucide-react-native";
import { useTheme } from "../theme";
import { ScreenHeader } from "../components";
import { Input } from "../components/Input";
import type { DecryptedMessage } from "../hooks/useChat";

// Recherche VOLONTAIREMENT limitée aux messages déjà déchiffrés en mémoire
// pour cette conversation : le serveur ne stockant jamais de texte en
// clair, une recherche côté serveur sur le contenu est structurellement
// impossible sans casser le principe de chiffrement de bout en bout.
export function MessageSearchScreen({ route, navigation }: any) {
  const { messages, title }: { messages: DecryptedMessage[]; title: string } = route.params;
  const { colors, typography, spacing, fontFamily } = useTheme();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => !m.decryptionFailed && m.text.toLowerCase().includes(q));
  }, [messages, query]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={`Rechercher dans « ${title} »`} onBack={() => navigation.goBack()} />
      <View style={{ padding: spacing.md }}>
        <Input placeholder="Rechercher un mot ou une phrase" value={query} onChangeText={setQuery} autoFocus />
        <Text style={[typography.caption, { color: colors.textMuted, fontFamily: fontFamily.regular }]}>
          Recherche uniquement dans les messages déjà chargés sur cet appareil.
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={[typography.body, { color: colors.textPrimary, fontFamily: fontFamily.regular }]} numberOfLines={2}>
              {item.text}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: 2 }]}>
              {item.outgoing ? "Vous" : "Eux"} · {formatDate(item.createdAt)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          query.trim() ? (
            <View style={{ padding: spacing.xl, alignItems: "center" }}>
              <SearchIcon size={24} color={colors.textMuted} />
              <Text style={[typography.body, { color: colors.textSecondary, fontFamily: fontFamily.regular, marginTop: spacing.sm }]}>
                Aucun résultat.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
