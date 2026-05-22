import { Stack } from 'expo-router';
import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function MainLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen name="tax" options={{ title: 'Tax Calculator' }} />
      <Stack.Screen name="wht-certificates" options={{ title: 'WHT Certificates' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="employees" options={{ title: 'Employee Management' }} />
      <Stack.Screen name="deadlines" options={{ title: 'Tax Deadlines' }} />
      <Stack.Screen name="tax-info/[type]" options={{ title: 'Tax Law Information' }} />
    </Stack>
  );
}
