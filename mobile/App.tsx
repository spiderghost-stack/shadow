import React, { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./src/theme";
import { AppNavigator, navigateToConversation } from "./src/navigation";
import { useAuthStore } from "./src/hooks/useAuthStore";
import { initCrypto } from "./src/crypto/init";

// Chiffrement initialisé une seule fois, avant tout le reste : voir
// src/crypto/init.ts (branche le générateur d'aléa sécurisé sur TweetNaCl).
initCrypto();

function Bootstrap({ children }: { children: React.ReactNode }) {
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    // Chargement de la police custom Arial Nova : DÉSACTIVÉ tant que les
    // fichiers .ttf ne sont pas fournis (voir src/theme/typography.ts pour
    // le pourquoi). Une fois les fichiers ajoutés dans
    // src/assets/fonts/, remplacez ce bloc par :
    //
    // Font.loadAsync({
    //   "ArialNova-Regular": require("./src/assets/fonts/ArialNova-Regular.ttf"),
    //   "ArialNova-Bold": require("./src/assets/fonts/ArialNova-Bold.ttf"),
    // }).then(() => { /* puis mettre à jour fontFamily dans theme/typography.ts */ });
    restore();

    // Tap sur une notification push -> ouvre directement la conversation
    // concernée (id seulement, jamais de contenu de message transmis).
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const conversationId = response.notification.request.content.data?.conversationId as string | undefined;
      if (conversationId) navigateToConversation(conversationId);
    });
    return () => subscription.remove();
  }, [restore]);

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Bootstrap>
        <AppNavigator />
        <StatusBar style="auto" />
      </Bootstrap>
    </ThemeProvider>
  );
}
