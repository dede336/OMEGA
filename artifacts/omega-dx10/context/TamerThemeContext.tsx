import React, { createContext, useContext, useState } from 'react';

interface TamerTheme {
  primary: string;
  primaryForeground: string;
}

const DEFAULT: TamerTheme = { primary: '#00d4ff', primaryForeground: '#060b14' };

const TamerThemeContext = createContext<{
  theme: TamerTheme;
  setTheme: (t: TamerTheme) => void;
}>({ theme: DEFAULT, setTheme: () => {} });

export function TamerThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<TamerTheme>(DEFAULT);
  return (
    <TamerThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </TamerThemeContext.Provider>
  );
}

export function useTamerTheme() {
  return useContext(TamerThemeContext);
}
