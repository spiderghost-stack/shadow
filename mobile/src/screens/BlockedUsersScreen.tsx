import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useTheme } from "../theme";
import { Avatar, ListItem, ScreenHeader } from "../components";
import { moderationApi } from "../services/api";

export function BlockedUsersScreen({ navigation }: any) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    moderationApi.listBlocked().then(setBlocks);
  }, []);

  async function unblock(userId: string) {
    await moderationApi.unblock(userId);
    setBlocks((prev) => prev.filter((b) => b.blockedId !== userId));
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Utilisateurs bloqués" onBack={() => navigation.goBack()} />
      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListItem
            title={item.blocked.displayName}
            subtitle={`@${item.blocked.username}`}
            left={<Avatar name={item.blocked.displayName} uri={item.blocked.avatarUrl} />}
            right={
              <Text
                onPress={() => unblock(item.blockedId)}
                style={[typography.bodySmall, { color: colors.accent, fontFamily: fontFamily.medium }]}
              >
                Débloquer
              </Text>
            }
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl, alignItems: "center" }}>
            <Text style={[typography.body, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Aucun utilisateur bloqué.
            </Text>
          </View>
        }
      />
    </View>
  );
}
