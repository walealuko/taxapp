import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const colorScheme = useColorScheme();

  return {
    isDark: colorScheme === 'dark',
    background: colorScheme === 'dark' ? '#1D1B3A' : '#F8F9FE',
    surface: colorScheme === 'dark' ? '#2D2A4A' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#ECEDEE' : '#2D3436',
    textSecondary: colorScheme === 'dark' ? '#9BA1A6' : '#9E9E9E',
    border: colorScheme === 'dark' ? '#3D3A5A' : '#E8E8E8',
    primary: '#6C63FF',
    cardBg: colorScheme === 'dark' ? '#2D2A4A' : '#FFFFFF',
    infoCardBg: colorScheme === 'dark' ? '#2A2535' : '#FFF9E6',
  };
}
