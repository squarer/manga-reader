"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { DesignThemeProvider } from "@/components/DesignThemeProvider";

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 主題提供者組件
 * DesignThemeProvider: 設計主題切換（Claude, Cursor, ...）
 * NextThemesProvider: light/dark/system 模式
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <DesignThemeProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </DesignThemeProvider>
  );
}
