import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark' | 'system';
export type AppTemplate = 'corporate' | 'glassmorphism';
export type ColorPalette = 'default' | 'wine' | 'frost-green' | 'nordic-slate' | 'amber-sunset' | 'royal-amethyst';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  template: AppTemplate;
  palette: ColorPalette;
  setTheme: (theme: AppTheme) => void;
  setTemplate: (template: AppTemplate) => void;
  setPalette: (palette: ColorPalette) => void;
}

const THEME_STORAGE_KEY = 'control_tower_app_theme';
const TEMPLATE_STORAGE_KEY = 'control_tower_app_template';
const PALETTE_STORAGE_KEY = 'control_tower_app_palette';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light';
  });

  const [template, setTemplateState] = useState<AppTemplate>(() => {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY) as AppTemplate;
    return saved === 'glassmorphism' ? 'glassmorphism' : 'corporate';
  });

  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    const saved = localStorage.getItem(PALETTE_STORAGE_KEY) as ColorPalette;
    const validPalettes: ColorPalette[] = ['default', 'wine', 'frost-green', 'nordic-slate', 'amber-sunset', 'royal-amethyst'];
    return validPalettes.includes(saved) ? saved : 'default';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
    document.documentElement.setAttribute('data-template', template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    document.documentElement.setAttribute('data-palette', palette);
  }, [palette]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const setTemplate = (newTemplate: AppTemplate) => {
    setTemplateState(newTemplate);
  };

  const setPalette = (newPalette: ColorPalette) => {
    setPaletteState(newPalette);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        template,
        palette,
        setTheme,
        setTemplate,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
