# Appels audio/vidéo — état actuel

La couche de SIGNALISATION est complète et fonctionnelle : `callSignaling.ts`
envoie/reçoit les événements `call:invite`, `call:accept`, `call:reject`,
`call:end`, `call:signal` via le WebSocket existant (backend déjà branché,
voir `backend/src/websocket/socket.ts`).

Ce qui MANQUE pour un appel réel avec son/image : la capture et le transport
du flux média lui-même, via WebRTC (`react-native-webrtc`).

**Pourquoi ce n'est pas inclus ici** : `react-native-webrtc` embarque du code
natif (iOS/Android) qui n'existe pas dans le runtime figé d'Expo Go. Il faut
un "dev client" (build EAS avec `expo-dev-client` + le plugin
`@config-plugins/react-native-webrtc`) pour l'utiliser — ce n'est plus de
l'Expo Go au sens strict.

## Pour activer les appels réels (une fois en dev client)

1. `npx expo install expo-dev-client`
2. `npm install react-native-webrtc @config-plugins/react-native-webrtc`
3. Ajouter le plugin dans `app.json` (`"plugins": [..., "@config-plugins/react-native-webrtc"]`)
4. Builder un dev client : `eas build --profile development`
5. Dans `CallScreen.tsx`, remplacer le mock local par un vrai
   `RTCPeerConnection` : créer l'offer/answer, les envoyer via
   `callSignaling.ts` (déjà prêt), gérer les `RTCIceCandidate` reçus.
6. Ajouter un serveur TURN pour les réseaux restrictifs (obligatoire en
   production ; un simple STUN public ne suffit pas toujours).

Tant que ces étapes ne sont pas faites, l'écran d'appel de ce projet affiche
un état "signalisation" (sonnerie, accepté/refusé) sans son ni image.
