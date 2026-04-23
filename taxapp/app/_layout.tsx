import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBiometricAuth, shouldUseBiometricAuth } from '@/hooks/useBiometricAuth';
import { initSentry } from '@/utils/sentry';
import GDPRConsent from '@/components/GDPRConsent';
import OnboardingGuide from '@/components/OnboardingGuide';
import NotificationService from '@/components/NotificationService';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Initialize Sentry on app load
initSentry();

const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C63FF',
    background: '#F8F9FE',
    card: '#FFFFFF',
    text: '#2D3436',
    border: '#E8E8E8',
    notification: '#FF6B6B',
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6C63FF',
    background: '#1D1B3A',
    card: '#2D2A4A',
    text: '#ECEDEE',
    border: '#3D3A5A',
    notification: '#FF6B6B',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { authenticate, isBiometricEnabled } = useBiometricAuth();
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          // Check if biometric is enabled and needs verification
          const biometricRequired = await shouldUseBiometricAuth();
          if (biometricRequired && isBiometricEnabled) {
            const result = await authenticate('Authenticate to access TaxApp');
            if (result.success) {
              setBiometricChecked(true);
            } else {
              setRequiresBiometric(true);
            }
          } else {
            setBiometricChecked(true);
          }
        } else {
          router.replace('/auth/login');
        }
      }
    };
    init();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (requiresBiometric) {
      const handleAppStateChange = async (nextAppState: string) => {
        if (nextAppState === 'active') {
          const result = await authenticate('Authenticate to access TaxApp');
          if (result.success) {
            setRequiresBiometric(false);
          }
        }
      };

      // Note: App state listener would need to be set up in a separate effect
      // For simplicity, we just set requiresBiometric true when biometric fails
    }
  }, [requiresBiometric]);

  if (isLoading || !biometricChecked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
          <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <OnboardingGuide />
        <GDPRConsent />
      </ThemeProvider>
      <AuthGate>
        {null}
      </AuthGate>
    </AuthProvider>
  );
}
