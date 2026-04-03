/** Available design system themes */
export enum DesignTheme {
  Claude = 'claude',
  Cursor = 'cursor',
  Apple = 'apple',
  Airbnb = 'airbnb',
  Stripe = 'stripe',
  XAI = 'xai',
  Raycast = 'raycast',
}

/** Theme metadata for UI display */
export interface DesignThemeInfo {
  id: DesignTheme;
  label: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    foreground: string;
  };
}

export const DESIGN_THEMES: DesignThemeInfo[] = [
  {
    id: DesignTheme.Claude,
    label: 'Claude',
    description: 'Warm parchment, terracotta',
    colors: {
      primary: '#c96442',
      background: '#f5f4ed',
      foreground: '#141413',
    },
  },
  {
    id: DesignTheme.Cursor,
    label: 'Cursor',
    description: 'Warm cream, vibrant orange',
    colors: {
      primary: '#f54e00',
      background: '#f2f1ed',
      foreground: '#26251e',
    },
  },
  {
    id: DesignTheme.Apple,
    label: 'Apple',
    description: 'Cool silver, system blue',
    colors: {
      primary: '#0071e3',
      background: '#f5f5f7',
      foreground: '#1d1d1f',
    },
  },
  {
    id: DesignTheme.Airbnb,
    label: 'Airbnb',
    description: 'Clean white, Rausch pink',
    colors: {
      primary: '#ff385c',
      background: '#ffffff',
      foreground: '#222222',
    },
  },
  {
    id: DesignTheme.Stripe,
    label: 'Stripe',
    description: 'Cool white, indigo purple',
    colors: {
      primary: '#533afd',
      background: '#ffffff',
      foreground: '#061b31',
    },
  },
  {
    id: DesignTheme.XAI,
    label: 'xAI',
    description: 'Monochrome, zero shadow',
    colors: {
      primary: '#1f2228',
      background: '#ffffff',
      foreground: '#1f2228',
    },
  },
  {
    id: DesignTheme.Raycast,
    label: 'Raycast',
    description: 'Near-black, coral red',
    colors: {
      primary: '#ff6363',
      background: '#f9f9f9',
      foreground: '#07080a',
    },
  },
];

export const DEFAULT_DESIGN_THEME = DesignTheme.Claude;
export const DESIGN_THEME_STORAGE_KEY = 'manga-reader-design-theme';
