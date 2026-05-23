import { Stack } from 'expo-router';
import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

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
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/')}
            style={{ marginLeft: 15 }}
          >
            <MaterialCommunityIcons name="home" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={{ marginRight: 15 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }}>
      <Stack.Screen name="index" options={{
        title: 'Welcome',
        headerLeft: () => null // Hide home button on the home page itself
      }} />
      <Stack.Screen name="tax" options={{ title: 'Tax Calculator' }} />
      <Stack.Screen name="wht-certificates" options={{ title: 'WHT Certificates' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="employees" options={{ title: 'Employee Management' }} />
      <Stack.Screen name="deadlines" options={{ title: 'Compliance Calendar' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="news" options={{ title: 'Tax News' }} />
      <Stack.Screen name="history" options={{ title: 'Tax History' }} />
      <Stack.Screen name="tax-info/[type]" options={{ title: 'Tax Law Information' }} />
    </Stack>
  );
}
