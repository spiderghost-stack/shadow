import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { LogIn, ShieldAlert, KeyRound, Smartphone } from "lucide-react-native";
import { useTheme } from "../theme";
import { ListItem, ScreenHeader } from "../components";
import { usersApi } from "../services/api";

const EVENT_LABELS: Record<string, { label: string; icon: any }> = {
  login_success: { label: "Connexion réussie", icon: LogIn },
  login_failed: { label: "Tentative de connexion échouée", icon: ShieldAlert },
  device_added: { label: "Nouvel appareil enregistré", icon: Smartphone },
  device_revoked: { label: "Appareil révoqué", icon: ShieldAlert },
  password_changed: { label: "Mot de passe modifié", icon: KeyRound },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function SecurityHistoryScreen({ navigation }: any) {
  const { colors, typography, spacing, fontFamily } = useTheme();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    usersApi.getSecurityEvents().then(setEvents);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Historique de sécurité" onBack={() => navigation.goBack()} />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const meta = EVENT_LABELS[item.type] ?? { label: item.type, icon: ShieldAlert };
          const Icon = meta.icon;
          return <ListItem title={meta.label} subtitle={formatDate(item.createdAt)} left={<Icon size={20} color={colors.textSecondary} />} />;
        }}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl, alignItems: "center" }}>
            <Text style={[typography.body, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Aucun événement pour l'instant.
            </Text>
          </View>
        }
      />
    </View>
  );
}
