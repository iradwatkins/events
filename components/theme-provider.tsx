"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    // Force light theme on mobile devices
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
      // Override any stored theme preference
      localStorage.setItem("theme", "light");
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
