'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DesignTheme,
  DEFAULT_DESIGN_THEME,
  DESIGN_THEME_STORAGE_KEY,
} from '@/lib/design-theme';
import { DesignThemeContext } from '@/lib/hooks/useDesignTheme';

export function DesignThemeProvider({ children }: { children: React.ReactNode }) {
  const [designTheme, setDesignThemeState] = useState<DesignTheme>(() => {
    if (typeof window === 'undefined') return DEFAULT_DESIGN_THEME;
    const stored = localStorage.getItem(DESIGN_THEME_STORAGE_KEY);
    if (stored && Object.values(DesignTheme).includes(stored as DesignTheme)) {
      return stored as DesignTheme;
    }
    return DEFAULT_DESIGN_THEME;
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-design-theme', designTheme);
    localStorage.setItem(DESIGN_THEME_STORAGE_KEY, designTheme);
  }, [designTheme]);

  const setDesignTheme = useCallback((theme: DesignTheme) => {
    setDesignThemeState(theme);
  }, []);

  return (
    <DesignThemeContext.Provider value={{ designTheme, setDesignTheme }}>
      {children}
    </DesignThemeContext.Provider>
  );
}
