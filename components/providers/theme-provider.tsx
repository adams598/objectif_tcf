"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "oc-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      if (value === "light" || value === "dark") {
        stored = value;
      }
    } catch {
      // ignore
    }

    const resolved = stored ?? initialTheme;
    setThemeState(resolved);
    applyTheme(resolved);
    setIsReady(true);
  }, [initialTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, isReady }),
    [theme, setTheme, isReady]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);}}catch(e){}})();`,
      }}
    />
  );
}
