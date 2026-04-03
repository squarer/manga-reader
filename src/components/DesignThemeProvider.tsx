'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DesignTheme,
  DEFAULT_DESIGN_THEME,
  DESIGN_THEME_STORAGE_KEY,
} from '@/lib/design-theme';
import { DesignThemeContext } from '@/lib/hooks/useDesignTheme';

export function DesignThemeProvider({ children }: { children: React.ReactNode }) {
  const [designTheme, setDesignThemeState] = useState<DesignTheme>(DEFAULT_DESIGN_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DESIGN_THEME_STORAGE_KEY);
    if (stored && Object.values(DesignTheme).includes(stored as DesignTheme)) {
      setDesignThemeState(stored as DesignTheme);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-design-theme', designTheme);
    if (isLoaded) {
      localStorage.setItem(DESIGN_THEME_STORAGE_KEY, designTheme);
    }
  }, [designTheme, isLoaded]);

  const setDesignTheme = useCallback((theme: DesignTheme) => {
    setDesignThemeState(theme);
  }, []);

  return (
    <DesignThemeContext.Provider value={{ designTheme, setDesignTheme }}>
      {children}
    </DesignThemeContext.Provider>
  );
}
