"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// ============= TYPES =============
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

// ============= CONTEXT =============
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
});

// ============= PROVIDER =============
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with light to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // On mount, read from localStorage and apply
  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("industrial-theme") as Theme;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Apply theme to HTML element
  function applyTheme(newTheme: Theme) {
    const html = document.documentElement;
    if (newTheme === "dark") {
      html.setAttribute("data-theme", "dark");
      html.classList.add("dark");
    } else {
      html.removeAttribute("data-theme");
      html.classList.remove("dark");
    }
  }

  // Set a specific theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("industrial-theme", newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Prevent hydration mismatch - render children only after mount
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: "light",
          toggleTheme: () => {},
          setTheme: () => {},
          isDark: false,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ============= HOOK =============
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
