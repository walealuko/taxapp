import { Tabs } from 'expo-router';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { COLORS } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function TabLayout() {
  const colors = useThemeColors();
  const isDark = colors.isDark;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="tax"
        options={{
          title: 'Tax',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>💼</Text>,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News & Laws',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📰</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📜</Text>,
        }}
      />
    </Tabs>
  );
}