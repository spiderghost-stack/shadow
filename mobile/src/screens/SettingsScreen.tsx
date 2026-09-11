import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Alert } from "react-native";
import { Smartphone, ShieldAlert, UserCog, Lock, UserX, ChevronRight, KeyRound, History } from "lucide-react-native";
import { useTheme } from "../theme";
import { ScreenHeader, ListItem, Avatar } from "../components";
import { Button } from "../components/Button";
import { devicesApi } from "../services/api";
import { useAuthStore } from "../hooks/useAuthStore";

export function SettingsScreen({ navigation }: any) {
  const { colors, spacing, typography, fontFamily } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    devicesApi.list().then(setDevices).catch(() => undefined);
  }, []);

  async function revoke(deviceId: string) {
    await devicesApi.revoke(deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }

  function renameDevice(deviceId: string, currentName: string) {
    Alert.prompt?.(
      "Renommer l'appareil",
      undefined,
      async (newName) => {
        if (!newName?.trim()) return;
        await devicesApi.rename(deviceId, newName.trim());
        setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, deviceName: newName.trim() } : d)));
      },
      "plain-text",
      currentName,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Paramètres" />

      <View style={{ padding: spacing.md, alignItems: "center" }}>
        <Avatar name={user?.displayName ?? "?"} size={64} uri={user?.avatarUrl} />
        <Text style={[typography.h3, { color: colors.textPrimary, fontFamily: fontFamily.medium, marginTop: spacing.sm }]}>
          {user?.displayName}
        </Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
          @{user?.username}
        </Text>
      </View>

      <ListItem
        title="Modifier le profil"
        left={<UserCog size={20} color={colors.textSecondary} />}
        right={<ChevronRight size={18} color={colors.textMuted} />}
        onPress={() => navigation.navigate("EditProfile")}
      />
      <ListItem
        title="Confidentialité"
        left={<Lock size={20} color={colors.textSecondary} />}
        right={<ChevronRight size={18} color={colors.textMuted} />}
        onPress={() => navigation.navigate("PrivacySettings")}
      />
      <ListItem
        title="Changer le mot de passe"
        left={<KeyRound size={20} color={colors.textSecondary} />}
        right={<ChevronRight size={18} color={colors.textMuted} />}
        onPress={() => navigation.navigate("ChangePassword")}
      />
      <ListItem
        title="Historique de sécurité"
        left={<History size={20} color={colors.textSecondary} />}
        right={<ChevronRight size={18} color={colors.textMuted} />}
        onPress={() => navigation.navigate("SecurityHistory")}
      />
      <ListItem
        title="Utilisateurs bloqués"
        left={<UserX size={20} color={colors.textSecondary} />}
        right={<ChevronRight size={18} color={colors.textMuted} />}
        onPress={() => navigation.navigate("BlockedUsers")}
      />

      <Text style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs, fontFamily: fontFamily.regular }]}>
        APPAREILS CONNECTÉS
      </Text>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListItem
            title={item.deviceName}
            subtitle={item.revokedAt ? "Révoqué" : "Actif"}
            left={<Smartphone size={20} color={colors.textSecondary} />}
            onPress={() => !item.revokedAt && renameDevice(item.id, item.deviceName)}
            right={
              !item.revokedAt ? (
                <ShieldAlert size={18} color={colors.danger} onPress={() => revoke(item.id)} />
              ) : undefined
            }
          />
        )}
      />

      <View style={{ padding: spacing.md }}>
        <Button label="Se déconnecter" variant="secondary" onPress={logout} />
      </View>
    </View>
  );
}
