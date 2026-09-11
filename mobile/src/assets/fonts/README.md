# Police Arial Nova

Arial Nova est une police sous licence Microsoft, non redistribuable dans ce dépôt.

Pour l'activer dans l'app :
1. Procurez-vous ArialNova-Regular.ttf et ArialNova-Bold.ttf (licence Windows/Office
   ou licence commerciale équivalente).
2. Placez-les dans ce dossier.
3. Dans App.tsx, décommentez le bloc de chargement `Font.loadAsync(...)` (voir commentaire dédié).
4. Dans src/theme/typography.ts, remplacez les valeurs de `fontFamily` par
   "ArialNova-Regular" / "ArialNova-Bold".

Tant que ces fichiers ne sont pas ajoutés, l'app fonctionne normalement avec la police système.
