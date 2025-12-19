import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemePalette = 'default' | 'ocean' | 'coral' | 'lavender' | 'forest';

interface ThemeContextType {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const palettes: { id: ThemePalette; name: string; color: string }[] = [
  { id: 'default', name: 'Salvia', color: '#4a9a7c' },
  { id: 'ocean', name: 'Océano', color: '#2d8ac7' },
  { id: 'coral', name: 'Coral', color: '#e07b54' },
  { id: 'lavender', name: 'Lavanda', color: '#9966cc' },
  { id: 'forest', name: 'Bosque', color: '#3d7a4a' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode');
    return (stored as ThemeMode) || 'light';
  });

  const [palette, setPalette] = useState<ThemePalette>(() => {
    const stored = localStorage.getItem('theme-palette');
    return (stored as ThemePalette) || 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'theme-ocean', 'theme-coral', 'theme-lavender', 'theme-forest');
    
    // Add mode
    if (mode === 'dark') {
      root.classList.add('dark');
    }
    
    // Add palette (except default)
    if (palette !== 'default') {
      root.classList.add(`theme-${palette}`);
    }
    
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-palette', palette);
  }, [mode, palette]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, palette, setMode, setPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
