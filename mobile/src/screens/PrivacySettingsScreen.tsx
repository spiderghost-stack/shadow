import React, { useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { useTheme } from "../theme";
import { ScreenHeader } from "../components";
import { usersApi } from "../services/api";

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary, fontFamily: fontFamily.medium }]}>{label}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, fontFamily: fontFamily.regular, marginTop: 2 }]}>
          {description}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.surfaceAlt }} />
    </View>
  );
}

export function PrivacySettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [hideNotificationBody, setHideNotificationBody] = useState(false);

  function update(key: string, value: boolean, setter: (v: boolean) => void) {
    setter(value);
    usersApi.updatePrivacy({ [key]: value }).catch(() => setter(!value)); // rollback si échec réseau
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Confidentialité" onBack={() => navigation.goBack()} />
      <ScrollView>
        <ToggleRow
          label="Dernière connexion visible"
          description="Vos contacts peuvent voir la dernière fois que vous étiez actif·ve."
          value={showLastSeen}
          onChange={(v) => update("showLastSeen", v, setShowLastSeen)}
        />
        <ToggleRow
          label="Statut en ligne visible"
          description="Vos contacts voient quand vous êtes en ligne."
          value={showOnlineStatus}
          onChange={(v) => update("showOnlineStatus", v, setShowOnlineStatus)}
        />
        <ToggleRow
          label="Accusés de lecture"
          description="Vos contacts voient quand vous avez lu leurs messages."
          value={showReadReceipts}
          onChange={(v) => update("showReadReceipts", v, setShowReadReceipts)}
        />
        <ToggleRow
          label="Masquer le contenu des notifications"
          description="Les notifications n'affichent aucun aperçu du message."
          value={hideNotificationBody}
          onChange={(v) => update("hideNotificationBody", v, setHideNotificationBody)}
        />
      </ScrollView>
    </View>
  );
}
