import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "../theme";
import { ScreenHeader, Avatar } from "../components";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { usersApi } from "../services/api";
import { useAuthStore } from "../hooks/useAuthStore";

export function EditProfileScreen({ navigation }: any) {
  const { colors, spacing } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await usersApi.updateProfile({ displayName: displayName.trim(), bio: bio.trim(), status: status.trim() });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Modifier le profil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
          <Avatar name={displayName || "?"} size={80} uri={user?.avatarUrl} />
        </View>

        <Input label="Nom affiché" value={displayName} onChangeText={setDisplayName} />
        <Input label="Statut" placeholder="Un mot sur vous" value={status} onChangeText={setStatus} />
        <Input label="Bio" placeholder="Quelques mots" value={bio} onChangeText={setBio} multiline style={{ minHeight: 80 }} />

        <Button label="Enregistrer" onPress={handleSave} loading={saving} />
      </ScrollView>
    </View>
  );
}
