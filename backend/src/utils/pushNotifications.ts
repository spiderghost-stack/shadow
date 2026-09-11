import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Règle absolue : cette fonction ne reçoit et n'envoie JAMAIS de contenu de
// message. Elle notifie qu'"un événement a eu lieu" (nouveau message,
// nouvelle demande de contact...), rien de plus — cohérent avec le fait que
// le serveur ne déchiffre jamais rien.
export async function sendPushNotifications(
  pushTokens: string[],
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  if (pushTokens.length === 0) return;

  const messages = pushTokens.map((to) => ({
    to,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Échec envoi notifications push (réponse non-OK)");
    }
  } catch (err) {
    // Une notification manquée n'est jamais bloquante pour l'envoi du
    // message lui-même : on journalise et on continue.
    logger.warn({ err }, "Échec envoi notifications push");
  }
}
