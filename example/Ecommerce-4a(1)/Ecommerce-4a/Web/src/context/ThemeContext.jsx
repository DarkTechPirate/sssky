import { createContext } from "react";
import { Theme } from "../theme";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Lock theme to Light Theme directly
  const theme = Theme;

  // 2. Disable toggle (empty function prevents errors if called)
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div
        style={{
          background: theme.bg,
          color: theme.text,
          minHeight: "100vh",
          // You can remove transition if the theme never changes,
          // but keeping it is harmless.
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
