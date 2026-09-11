// Police unique imposée par le cahier des charges : Arial Nova.
//
// IMPORTANT — Arial Nova est une police sous licence Microsoft, non
// redistribuable : ces fichiers ne sont PAS fournis dans ce projet. Pour
// l'activer :
//   1. Obtenez ArialNova-Regular.ttf et ArialNova-Bold.ttf (licence Windows/
//      Office, ou licence commerciale équivalente).
//   2. Placez-les dans mobile/src/assets/fonts/.
//   3. Décommentez le chargement dans App.tsx (voir commentaire dédié).
// En attendant, l'app utilise la police système ("System") pour ne jamais
// afficher d'écran vide ou planter au démarrage.
export const fontFamily = {
  regular: "System",
  medium: "System",
  bold: "System",
  fallback: "System",
};

export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: "600" as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Rayons de bordure volontairement modestes : le cahier des charges interdit
// les coins exagérément arrondis et les "pill shapes" décoratifs.
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};
