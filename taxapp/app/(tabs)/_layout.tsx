import { Tabs } from 'expo-router';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { COLORS } from '../../constants/tax';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9BA1A6',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1D1B3A' : '#fff',
          borderTopColor: isDark ? '#3D3A5A' : '#E8E8E8',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="paye"
        options={{
          title: 'PAYE',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💼</Text>,
        }}
      />
      <Tabs.Screen
        name="vat"
        options={{
          title: 'VAT',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🧾</Text>,
        }}
      />
      <Tabs.Screen
        name="wht"
        options={{
          title: 'WHT',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>✂️</Text>,
        }}
      />
      <Tabs.Screen
        name="cgt"
        options={{
          title: 'CGT',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📜</Text>,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📰</Text>,
        }}
      />
      <Tabs.Screen
        name="estimated-tax"
        options={{
          title: 'Estimates',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
    </Tabs>
  );
}
