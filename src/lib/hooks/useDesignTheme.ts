'use client';

import { createContext, useContext } from 'react';
import { DesignTheme, DEFAULT_DESIGN_THEME } from '@/lib/design-theme';

interface DesignThemeContextValue {
  designTheme: DesignTheme;
  setDesignTheme: (theme: DesignTheme) => void;
}

export const DesignThemeContext = createContext<DesignThemeContextValue>({
  designTheme: DEFAULT_DESIGN_THEME,
  setDesignTheme: () => {},
});

export function useDesignTheme() {
  return useContext(DesignThemeContext);
}
