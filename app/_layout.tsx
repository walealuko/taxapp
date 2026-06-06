import { Stack, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TaxConfigProvider } from '@/contexts/TaxConfigContext';
import { COLORS as TaxColors } from '@/constants/tax';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { NotificationService } from '@/services/NotificationService';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    NotificationService.init();

    if (isLoading) return;

    const inAuthGroup =
  segments?.some(segment => segment === 'auth') ?? false;

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (

    <GluestackUIProvider mode="dark">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TaxColors.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </GluestackUIProvider>

    );
  }

  return (
    <Stack>
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TaxConfigProvider>
        <RootLayoutNav />
      </TaxConfigProvider>
    </AuthProvider>
  );
}
