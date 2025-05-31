import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      // First check localStorage for theme
      const savedTheme = localStorage.getItem("praisePresent_settings");
      if (savedTheme) {
        try {
          const settings = JSON.parse(savedTheme);
          if (settings.theme) return settings.theme as Theme;
        } catch (error) {
          console.warn("Failed to parse settings from localStorage:", error);
        }
      }

      // Fallback to old theme storage
      const oldTheme = localStorage.getItem("theme") as Theme;
      if (oldTheme) return oldTheme;

      return "system";
    }
    return "system";
  });

  // Function to apply theme
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
    }
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);

    // Update settings in localStorage
    if (typeof window !== "undefined") {
      try {
        const existingSettings = localStorage.getItem("praisePresent_settings");
        let settings = {};

        if (existingSettings) {
          settings = JSON.parse(existingSettings);
        }

        settings = { ...settings, theme };
        localStorage.setItem(
          "praisePresent_settings",
          JSON.stringify(settings)
        );

        // Also keep the old theme storage for backward compatibility
        localStorage.setItem("theme", theme);
      } catch (error) {
        console.error("Failed to save theme to localStorage:", error);
      }
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
