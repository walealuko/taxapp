import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Text } from 'react-native';
import { COLORS } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 280,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          headerTitle: 'TaxApp Home',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Drawer.Screen
        name="tax"
        options={{
          drawerLabel: 'Tax Calculator',
          headerTitle: 'Tax Calculation',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💼</Text>,
        }}
      />
      <Drawer.Screen
        name="news"
        options={{
          drawerLabel: 'News & Laws',
          headerTitle: 'Latest Tax Updates',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📰</Text>,
        }}
      />
      <Drawer.Screen
        name="subscription"
        options={{
          drawerLabel: 'Subscription',
          headerTitle: 'Subscription Plan',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💳</Text>,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          drawerLabel: 'History',
          headerTitle: 'Tax History',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📜</Text>,
        }}
      />
      <Drawer.Screen
        name="deadlines"
        options={{
          drawerLabel: 'Deadlines',
          headerTitle: 'Tax Deadlines',
          drawerIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
    </Drawer>
  );
}