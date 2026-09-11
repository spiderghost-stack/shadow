import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { lightColors, darkColors, ColorPalette } from "./colors";
import { typography, spacing, radius, fontFamily } from "./typography";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  fontFamily: typeof fontFamily;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("light"); // clair par défaut, conforme au cahier des charges

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, typography, spacing, radius, fontFamily, isDark, mode, setMode }),
    [colors, isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé sous ThemeProvider.");
  return ctx;
}
