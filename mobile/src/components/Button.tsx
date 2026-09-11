import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

// Bouton volontairement sobre : pas de dégradé, coins légèrement arrondis
// (radius.md), pas de forme "pill". L'état pressé est rendu par une simple
// variation d'opacité, sans animation superflue.
export function Button({ label, onPress, variant = "primary", disabled, loading, style }: ButtonProps) {
  const { colors, typography, spacing, radius, fontFamily } = useTheme();

  const backgroundColor =
    variant === "primary" ? colors.accent : variant === "danger" ? colors.danger : colors.surfaceAlt;
  const textColor = variant === "secondary" ? colors.textPrimary : colors.accentText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderRadius: radius.md,
          paddingVertical: spacing.md - 2,
          paddingHorizontal: spacing.lg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            typography.button,
            { color: textColor, fontFamily: fontFamily.medium },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
