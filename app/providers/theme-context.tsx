"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ThemeContextType = {
  dark: boolean;
  toggleDark: () => void;
};

// 1) Context 타입 지정 (초기값은 null 허용)
const ThemeContext = createContext<ThemeContextType | null>(null);

// 2) Provider 컴포넌트 타입 지정
type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [dark, setDark] = useState(false);

  const toggleDark = () => setDark((v) => !v);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3) Custom Hook (널체크 포함)
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
