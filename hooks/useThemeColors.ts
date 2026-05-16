import { useColorScheme } from 'react-native';
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
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#C7D2FE',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  white: '#FFFFFF',
  light: '#F3F4F6',
  gray: '#9CA3AF',
  dark: '#1F2937',
  lightGray: '#F3F4F6',
  cardBg: '#FFFFFF',
  infoCardBg: '#EEF2FF',
};

const darkColors: ThemeColors = {
  isDark: true,
  background: '#0A0A0A',
  surface: '#171717',
  text: '#F9FAFB',
  textSecondary: '#A3A3A3',
  border: '#262626',
  primary: '#818CF8',
  primaryDark: '#6366F1',
  secondary: '#312E81',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  white: '#FFFFFF',
  light: '#262626',
  gray: '#71717A',
  dark: '#F9FAFB',
  lightGray: '#262626',
  cardBg: '#171717',
  infoCardBg: '#1E1B4B',
};

export function useThemeColors(): ThemeColors {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
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
