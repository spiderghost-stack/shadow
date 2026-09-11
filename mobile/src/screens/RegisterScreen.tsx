import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { useTheme } from "../theme";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuthStore } from "../hooks/useAuthStore";

export function RegisterScreen({ navigation }: any) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  const register = useAuthStore((s) => s.register);
  const status = useAuthStore((s) => s.status);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (password.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caractères.");
      return;
    }
    try {
      await register({ username: username.trim(), displayName: displayName.trim(), password });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Inscription impossible.");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: "center" }}>
        <Text style={[typography.h1, { color: colors.textPrimary, fontFamily: fontFamily.bold, marginBottom: spacing.lg }]}>
          Créer un compte
        </Text>

        <Input label="Nom d'utilisateur" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
        <Input label="Nom affiché" value={displayName} onChangeText={setDisplayName} />
        <Input label="Mot de passe (10 caractères min.)" isPassword value={password} onChangeText={setPassword} />

        {error ? (
          <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.md, fontFamily: fontFamily.regular }]}>
            {error}
          </Text>
        ) : null}

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md, fontFamily: fontFamily.regular }]}>
          Vos clés de chiffrement seront générées directement sur cet appareil et n'en sortiront jamais.
        </Text>

        <Button label="Créer mon compte" onPress={handleSubmit} loading={status === "loading"} />

        <Text
          onPress={() => navigation.navigate("Login")}
          style={[typography.bodySmall, { color: colors.accent, textAlign: "center", marginTop: spacing.lg, fontFamily: fontFamily.regular }]}
        >
          Déjà un compte ? Connectez-vous
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
