import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { useTheme } from "../theme";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuthStore } from "../hooks/useAuthStore";

export function LoginScreen({ navigation }: any) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Connexion impossible.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.content, { padding: spacing.lg }]}>
        <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
          <ShieldCheck size={40} color={colors.accent} />
          <Text style={[typography.h1, { color: colors.textPrimary, fontFamily: fontFamily.bold, marginTop: spacing.sm }]}>
            Shadow
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, fontFamily: fontFamily.regular, marginTop: 4 }]}>
            Messagerie chiffrée de bout en bout
          </Text>
        </View>

        <Input
          label="Nom d'utilisateur"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <Input label="Mot de passe" isPassword value={password} onChangeText={setPassword} />

        {error ? (
          <Text style={[typography.bodySmall, { color: colors.danger, marginBottom: spacing.md, fontFamily: fontFamily.regular }]}>
            {error}
          </Text>
        ) : null}

        <Button label="Se connecter" onPress={handleSubmit} loading={status === "loading"} />

        <Text
          onPress={() => navigation.navigate("Register")}
          style={[typography.bodySmall, { color: colors.accent, textAlign: "center", marginTop: spacing.lg, fontFamily: fontFamily.regular }]}
        >
          Pas encore de compte ? Créez-en un
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center" },
});
