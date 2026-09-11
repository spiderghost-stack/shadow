# Shadow — Messagerie chiffrée de bout en bout

Application développée selon les deux cahiers des charges fournis. Stack :
**React Native + Expo (Expo Go) + TypeScript** côté mobile, **Node.js + Express +
Prisma + PostgreSQL + Socket.IO** côté backend, chiffrement **TweetNaCl**
(X25519 / Ed25519 / XSalsa20-Poly1305).

## Démarrage rapide

### Backend
```bash
cd backend
cp .env.example .env        # renseignez DATABASE_URL + secrets JWT
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev                 # démarre sur http://localhost:4000
```

### Mobile (Expo Go)
```bash
cd mobile
npm install
# éditez src/services/api/client.ts si besoin, ou définissez
# EXPO_PUBLIC_API_URL=http://<IP_LOCALE_DE_VOTRE_MACHINE>:4000
npx expo start
# scannez le QR code avec l'app Expo Go (iOS/Android)
```

⚠️ Depuis un téléphone physique, `localhost` ne pointe pas vers votre machine.
Utilisez l'IP locale de votre ordinateur sur le même réseau Wi-Fi
(`ipconfig` / `ifconfig`), ex. `http://192.168.1.20:4000`.

## Ce qui est implémenté (MVP)

**Backend** — complet, compile sans erreur :
- Auth (register/login/refresh/logout), argon2id, JWT + rotation, sessions révocables
- Appareils : enregistrement des clés publiques, prekeys à usage unique, révocation, renommage, jeton push
- Conversations directes + groupes, ajout/retrait de membres (admin), détail de conversation
- Messages : envoi/édition/suppression, accusés livraison/lecture, messages éphémères + purge auto
- Pièces jointes : upload de blobs déjà chiffrés côté client (`/api/uploads`)
- WebSocket authentifié : messages temps réel, éditions, suppressions, typing, présence, **signalisation d'appel** (invite/accept/reject/end/signal — voir limites)
- Notifications push (Expo push API) déclenchées à chaque nouveau message — contenu toujours générique ("Nouveau message"), jamais le texte, jamais envoyée aux membres en sourdine
- Blocages, signalements, mute de conversation, rate limiting
- Historique de sécurité (connexions, appareils, mot de passe), logs avec redaction stricte des secrets

**Mobile** — écrans fonctionnels de bout en bout :
- Inscription / connexion, génération des clés sur l'appareil (jamais transmises)
- Liste des conversations, nouvelle conversation, nouveau groupe (sélection multiple)
- Chat : texte chiffré réel, images chiffrées, messages éphémères, édition/suppression (appui long), **recherche dans les messages déjà déchiffrés**
- Infos de conversation : membres, ajout/retrait (admin), mute, quitter
- Blocage / signalement depuis le chat, écran "Utilisateurs bloqués"
- Paramètres : profil, confidentialité, changement de mot de passe, historique de sécurité, gestion/renommage des appareils
- **Notifications push** : réception, tap → ouverture directe de la conversation
- **Écran d'appel** (boutons audio/vidéo dans le chat) : sonnerie, accepter/refuser/raccrocher fonctionnels via WebSocket — **sans son ni image réels** (voir limites ci-dessous)
- Design system : palette claire/sombre, pas de dégradé, pas de "pill shape", icônes Lucide

## Limites assumées de ce MVP (à traiter en V2)

1. **Pas de Double Ratchet** : la clé de session est dérivée une fois par paire
   d'appareils (X3DH simplifié), pas re-dérivée à chaque message. Chiffrement de
   bout en bout réel et authentifié, mais sans la forward secrecy *par message*
   d'un vrai protocole Signal.
2. **Un seul appareil "principal" par destinataire** en conversation directe :
   l'envoi chiffre vers l'appareil actif le plus récent du destinataire, pas
   vers tous ses appareils (pas de fan-out multi-device complet). Les groupes
   envoient également vers un seul appareil par membre pour la même raison.
3. **Déchiffrement des pièces jointes SORTANTES limité à la session en cours** :
   après redémarrage de l'app, une image que VOUS avez envoyée peut ne plus se
   réafficher si la session locale a été perdue (les images REÇUES, elles,
   se déchiffrent toujours correctement). Voir commentaire dans `useChat.ts`.
4. **Déduplication des messages simplifiée** : le serveur ne persiste pas
   `clientMessageId`, la dédup du message optimiste vs. l'écho WebSocket se
   fait en ignorant l'écho de ses propres messages plutôt que par id.
5. **Recherche dans les messages limitée au client** : comme le serveur ne
   déchiffre jamais rien, il ne peut pas indexer/rechercher le contenu — la
   recherche ne porte que sur les messages déjà chargés localement dans la
   conversation ouverte, pas sur tout l'historique ni toutes les conversations.
6. **Appels audio/vidéo — signalisation seulement, pas de son ni d'image** :
   `react-native-webrtc` nécessite du code natif incompatible avec Expo Go.
   Toute la mécanique WebSocket (invite/accept/reject/end/signal) est prête
   et fonctionnelle ; il manque uniquement la capture/le transport média
   WebRTC, à brancher une fois passé en dev client. Voir
   `mobile/src/services/webrtc/README.md` pour la marche à suivre exacte.
7. **Police Arial Nova non incluse** (licence Microsoft) — voir
   `mobile/src/assets/fonts/README.md`. L'app utilise la police système en attendant.
8. **Fichiers uploadés servis sans authentification par conversation**
   (`express.static`) : les blobs sont chiffrés donc illisibles sans la clé,
   mais leur existence/taille reste exposée. À durcir en V2.
9. **Prisma non généré avec le vrai moteur** dans cet environnement (réseau
   restreint côté sandbox) — chez vous, `npx prisma generate` avec un accès
   réseau normal activera le typage strict complet.
10. **Notifications push testables uniquement sur un vrai projet Expo/EAS**
    configuré (le token Expo push nécessite un `projectId` EAS) — sur un
    simulateur ou sans projet EAS configuré, l'enregistrement du token échoue
    silencieusement sans bloquer le reste de l'app.

## Vérifications effectuées

- `cd backend && npx tsc --noEmit` → 0 erreur
- `cd mobile && npx tsc --noEmit` → 0 erreur
- Dépendances installées et compatibles Expo Go (aucun module natif hors
  runtime Expo Go — les appels WebRTC sont l'exception documentée ci-dessus)
