import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useTamerTheme } from "@/context/TamerThemeContext";

export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;

  const { theme } = useTamerTheme();
  return { ...palette, primary: theme.primary, primaryForeground: theme.primaryForeground, radius: colors.radius };
}
