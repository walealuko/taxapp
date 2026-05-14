import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
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
  cardBg: string;
  infoCardBg: string;
}

const lightColors: ThemeColors = {
  isDark: false,
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  primary: '#0F172A',
  primaryDark: '#0F172A',
  secondary: '#2563EB',
  success: '#059669',
  warning: '#D97706',
  info: '#0891B2',
  white: '#FFFFFF',
  light: '#F8FAFC',
  gray: '#64748B',
  dark: '#0F172A',
  lightGray: '#E2E8F0',
  cardBg: '#F8FAFC',
  infoCardBg: '#F0F9FF',
};

const darkColors: ThemeColors = {
  isDark: true,
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#F8FAFC',
  primaryDark: '#F8FAFC',
  secondary: '#60A5FA',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#22D3EE',
  white: '#FFFFFF',
  light: '#1E293B',
  gray: '#94A3B8',
  dark: '#F8FAFC',
  lightGray: '#334155',
  cardBg: '#1E293B',
  infoCardBg: '#0C1E33',
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
      } catch (e) {
        console.warn('Failed to load theme from AsyncStorage', e);
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
        const saved = await AsyncStorage으로 getItem('theme_mode');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeMode(saved as ThemeMode);
        }
      } catch (e) {
        console.warn('Failed to load theme from AsyncStorage', e);
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
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (e) {
      console.warn('Failed to save theme to AsyncStorage', e);
    }
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
