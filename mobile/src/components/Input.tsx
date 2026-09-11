import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "../theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({ label, error, isPassword, style, ...rest }: InputProps) {
  const { colors, typography, spacing, radius, fontFamily } = useTheme();
  const [hidden, setHidden] = useState(isPassword);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text
          style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: spacing.xs, fontFamily: fontFamily.regular }]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.row,
          {
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          style={[
            typography.body,
            { flex: 1, color: colors.textPrimary, fontFamily: fontFamily.regular, paddingVertical: spacing.sm + 4 },
            style,
          ]}
        />
        {isPassword ? (
          <Text onPress={() => setHidden((h) => !h)} accessibilityRole="button">
            {hidden ? <Eye size={20} color={colors.textMuted} /> : <EyeOff size={20} color={colors.textMuted} />}
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs, fontFamily: fontFamily.regular }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
});
