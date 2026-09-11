import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { devicesApi } from "../services/api";

// Comportement d'affichage en premier plan : on affiche quand même la
// notification (utile si l'app est ouverte sur un autre écran que le chat
// concerné), mais son contenu reste générique — voir backend
// utils/pushNotifications.ts, qui n'envoie jamais le texte du message.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return; // pas de push sur simulateur/émulateur

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await devicesApi.setPushToken(token.data);
  } catch {
    // L'enregistrement du token n'est jamais bloquant pour le reste de
    // l'app (ex. projet Expo non configuré pour le push en local).
  }
}
