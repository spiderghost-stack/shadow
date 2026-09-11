import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "../theme";
import { ScreenHeader } from "../components";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { usersApi } from "../services/api";

export function ChangePasswordScreen({ navigation }: any) {
  const { colors, spacing, typography, fontFamily } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (next.length < 10) {
      setError("Le nouveau mot de passe doit contenir au moins 10 caractères.");
      return;
    }
    setSaving(true);
    try {
      await usersApi.changePassword(current, next);
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Changer le mot de passe" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Input label="Mot de passe actuel" isPassword value={current} onChangeText={setCurrent} />
        <Input label="Nouveau mot de passe" isPassword value={next} onChangeText={setNext} />

        {error ? (
          <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.md, fontFamily: fontFamily.regular }]}>
            {error}
          </Text>
        ) : null}

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md, fontFamily: fontFamily.regular }]}>
          Changer votre mot de passe déconnectera tous vos autres appareils par sécurité.
        </Text>

        <Button label="Confirmer" onPress={handleSubmit} loading={saving} />
      </ScrollView>
    </View>
  );
}
