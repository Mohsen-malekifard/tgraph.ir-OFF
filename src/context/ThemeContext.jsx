"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("red");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem("chat_color_theme");
    const storedDayMode = localStorage.getItem("chat_day_mode");

    const parsedTheme = Number(storedTheme);

    let nextTheme = "red";
    let nextIsDark = true;

    if (
      storedTheme !== null &&
      Number.isInteger(parsedTheme) &&
      parsedTheme >= 1 &&
      parsedTheme <= 4
    ) {
      nextTheme =
        parsedTheme === 1 || parsedTheme === 3 ? "blue" : "red";

      nextIsDark = parsedTheme === 1 || parsedTheme === 2;
    }

    if (storedDayMode !== null) {
      nextIsDark = storedDayMode !== "true";
    }

    setTheme(nextTheme);
    setIsDark(nextIsDark);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        setIsDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
