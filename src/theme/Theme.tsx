import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  tabBarBackground: string;
};

const LIGHT_COLORS: ThemeColors = {
  background: '#f5f5f5',
  card: '#fff',
  text: '#333',
  mutedText: '#666',
  border: '#e0e0e0',
  primary: '#4CAF50',
  danger: '#f44336',
  success: '#4CAF50',
  tabBarBackground: '#fff',
};

const DARK_COLORS: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#EDEDED',
  mutedText: '#BBBBBB',
  border: '#2A2A2A',
  primary: '#81C784',
  danger: '#EF5350',
  success: '#81C784',
  tabBarBackground: '#1E1E1E',
};

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const APP_THEME_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(APP_THEME_KEY);
      if (stored === 'dark' || stored === 'light') setModeState(stored);
    })();
  }, []);

  const setMode = useCallback(async (m: ThemeMode) => {
    await AsyncStorage.setItem(APP_THEME_KEY, m);
    setModeState(m);
  }, []);

  const toggle = useCallback(async () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    await setMode(next);
  }, [mode, setMode]);

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const value = useMemo(() => ({ mode, colors, setMode, toggle }), [mode, colors, setMode, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


