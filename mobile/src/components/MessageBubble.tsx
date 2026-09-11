import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Check, CheckCheck, Lock } from "lucide-react-native";
import { useTheme } from "../theme";

interface MessageBubbleProps {
  text: string;
  outgoing: boolean;
  status?: "sent" | "delivered" | "read";
  time: string;
  failed?: boolean;
  decryptionFailed?: boolean;
}

export function MessageBubble({ text, outgoing, status, time, decryptionFailed }: MessageBubbleProps) {
  const { colors, typography, spacing, radius, fontFamily } = useTheme();

  const bg = outgoing ? colors.bubbleOutgoing : colors.bubbleIncoming;
  const fg = outgoing ? colors.bubbleOutgoingText : colors.bubbleIncomingText;

  return (
    <View style={[styles.row, { justifyContent: outgoing ? "flex-end" : "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bg,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        {decryptionFailed ? (
          <View style={styles.errorRow}>
            <Lock size={14} color={fg} />
            <Text style={[typography.bodySmall, { color: fg, fontFamily: fontFamily.regular, marginLeft: 6 }]}>
              Message non déchiffrable sur cet appareil
            </Text>
          </View>
        ) : (
          <Text style={[typography.body, { color: fg, fontFamily: fontFamily.regular }]}>{text}</Text>
        )}

        <View style={styles.metaRow}>
          <Text style={[typography.caption, { color: fg, opacity: 0.7, fontFamily: fontFamily.regular }]}>
            {time}
          </Text>
          {outgoing && status ? (
            <View style={{ marginLeft: 4 }}>
              {status === "read" ? (
                <CheckCheck size={14} color={fg} />
              ) : status === "delivered" ? (
                <CheckCheck size={14} color={fg} opacity={0.6} />
              ) : (
                <Check size={14} color={fg} opacity={0.6} />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: 3, paddingHorizontal: 12 },
  bubble: { maxWidth: "78%" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4 },
  errorRow: { flexDirection: "row", alignItems: "center" },
});
