import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  info: string;
  white: string;
  light: string;
  gray: string;
  dark: string;
  lightGray: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  surface: string;
  cardBg: string;
  infoCardBg: string;
}

const lightColors: ThemeColors = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  secondary: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFB74D',
  info: '#29B6F6',
  white: '#FFFFFF',
  light: '#F8F9FE',
  gray: '#9E9E9E',
  dark: '#2D3436',
  lightGray: '#E8E8E8',
  background: '#F8F9FE',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#9E9E9E',
  border: '#E8E8E8',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  infoCardBg: '#F0F4FF',
};

const darkColors: ThemeColors = {
  primary: '#8B83FF',
  primaryDark: '#6C63FF',
  secondary: '#FF8A8A',
  success: '#66BB6A',
  warning: '#FFCA28',
  info: '#4FC3F7',
  white: '#FFFFFF',
  light: '#1D1B3A',
  gray: '#B0B0B0',
  dark: '#ECEDEE',
  lightGray: '#3D3A5A',
  background: '#12122A',
  card: '#1D1B3A',
  text: '#ECEDEE',
  textSecondary: '#B0B0B0',
  border: '#3D3A5A',
  surface: '#2D2A4A',
  cardBg: '#2D2A4A',
  infoCardBg: '#1A1A35',
};

export function useThemeColors(): ThemeColors {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme_mode');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeMode(saved as ThemeMode);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const effectiveTheme = themeMode === 'system'
    ? (systemColorScheme || 'light')
    : themeMode;

  return effectiveTheme === 'dark' ? darkColors : lightColors;
}

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme_mode');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeMode(saved as ThemeMode);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const effectiveTheme = themeMode === 'system'
    ? (systemColorScheme || 'light')
    : themeMode;

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('theme_mode', mode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    await setTheme(next);
  }, [effectiveTheme, setTheme]);

  return {
    themeMode,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isDark: effectiveTheme === 'dark',
    isLoading,
    colors: effectiveTheme === 'dark' ? darkColors : lightColors,
  };
}

export { lightColors, darkColors };
