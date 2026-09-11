// Palette Shadow. Règles du cahier des charges design respectées :
// - Mode clair par défaut
// - Mode sombre = vraie palette pensée, pas juste une inversion
// - Pas de dégradés
// - Contraste suffisant (lisibilité prioritaire sur l'esthétique)

export const lightColors = {
  background: "#FFFFFF",
  surface: "#F5F5F7",
  surfaceAlt: "#ECECEF",
  border: "#E1E1E6",

  textPrimary: "#111114",
  textSecondary: "#5B5B63",
  textMuted: "#9A9AA2",

  accent: "#2D5BFF",
  accentText: "#FFFFFF",

  success: "#1E9E5A",
  warning: "#C77700",
  danger: "#D63A3A",

  bubbleOutgoing: "#2D5BFF",
  bubbleOutgoingText: "#FFFFFF",
  bubbleIncoming: "#F0F0F3",
  bubbleIncomingText: "#111114",
};

export const darkColors = {
  background: "#0E0E10",
  surface: "#18181B",
  surfaceAlt: "#212124",
  border: "#2C2C30",

  textPrimary: "#F2F2F4",
  textSecondary: "#B4B4BC",
  textMuted: "#75757D",

  accent: "#5C81FF",
  accentText: "#0E0E10",

  success: "#3FC583",
  warning: "#E4A23A",
  danger: "#E86464",

  bubbleOutgoing: "#5C81FF",
  bubbleOutgoingText: "#0E0E10",
  bubbleIncoming: "#212124",
  bubbleIncomingText: "#F2F2F4",
};

export type ColorPalette = typeof lightColors;
