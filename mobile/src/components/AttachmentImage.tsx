import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { ImageOff } from "lucide-react-native";
import { useTheme } from "../theme";
import { sessionStore } from "../crypto/sessionStore";
import { downloadAndDecryptAttachment } from "../crypto/attachmentFlow";

interface Props {
  storageUrl: string;
  encryptionNonce: string;
  remoteDeviceId?: string;
  localPreviewUri?: string;
}

export function AttachmentImage({ storageUrl, encryptionNonce, remoteDeviceId, localPreviewUri }: Props) {
  const { colors, typography, fontFamily, radius } = useTheme();
  const [uri, setUri] = useState<string | null>(localPreviewUri ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    localPreviewUri ? "ready" : "loading",
  );

  useEffect(() => {
    if (localPreviewUri) return;
    let active = true;

    (async () => {
      if (!remoteDeviceId) {
        setStatus("unavailable");
        return;
      }
      const sharedKey = await sessionStore.load(remoteDeviceId);
      if (!sharedKey) {
        if (active) setStatus("unavailable");
        return;
      }
      try {
        const localUri = await downloadAndDecryptAttachment({ storageUrl, encryptionNonce, sharedKey, suggestedExt: "jpg" });
        if (active) {
          setUri(localUri);
          setStatus("ready");
        }
      } catch {
        if (active) setStatus("unavailable");
      }
    })();

    return () => {
      active = false;
    };
  }, [storageUrl, encryptionNonce, remoteDeviceId, localPreviewUri]);

  if (status === "loading") {
    return (
      <View style={[styles.box, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (status === "unavailable" || !uri) {
    return (
      <View style={[styles.box, { backgroundColor: colors.surfaceAlt, borderRadius: radius.md }]}>
        <ImageOff size={22} color={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: 4 }]}>
          Image indisponible sur cet appareil
        </Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={[styles.image, { borderRadius: radius.md }]} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  box: { width: 220, height: 160, alignItems: "center", justifyContent: "center" },
  image: { width: 220, height: 160 },
});
