import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "../theme";

export function Avatar({ uri, name, size = 44 }: { uri?: string | null; name: string; size?: number }) {
  const { colors, fontFamily } = useTheme();
  const initial = name.trim().charAt(0).toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.medium, fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomColor: colors.border },
      ]}
    >
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={{ marginRight: spacing.sm }}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <Text style={[typography.h3, { color: colors.textPrimary, fontFamily: fontFamily.medium, flex: 1 }]}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function ListItem({
  title,
  subtitle,
  left,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, backgroundColor: pressed ? colors.surface : "transparent" },
      ]}
    >
      {left ? <View style={{ marginRight: spacing.sm }}>{left}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.textPrimary, fontFamily: fontFamily.medium }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.bodySmall, { color: colors.textSecondary, fontFamily: fontFamily.regular, marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  item: { flexDirection: "row", alignItems: "center" },
});
