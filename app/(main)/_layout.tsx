import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '@/contexts/AuthContext';
import { TYPOGRAPHY } from '@/constants/typography';
import { OnboardingTour } from '@/components/OnboardingTour';

function CustomDrawerContent(props: any) {
  const colors = useThemeColors();
  const { user } = useAuth();

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
      <View style={[styles.userProfile, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account" size={40} color="#fff" />
        </View>
        <Text style={[styles.userName, { color: '#fff', ...TYPOGRAPHY.heading }]}>
          {user?.firstName || 'User'} {user?.lastName || ''}
        </Text>
        <Text style={[styles.userEmail, { color: 'rgba(255,255,255,0.7)', ...TYPOGRAPHY.caption }]}>
          {user?.email || 'Not signed in'}
        </Text>
      </View>
      <View style={styles.menuContainer}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainLayout() {
  const colors = useThemeColors();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>Please login to access this page.</Text>
        <TouchableOpacity
          style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <OnboardingTour />
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          width: 280,
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          ...TYPOGRAPHY.body,
          fontWeight: '500',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ marginLeft: 15 }}
          >
            <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={{ marginRight: 15 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      }}>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Welcome',
          drawerLabel: 'Home',
          headerLeft: () => null
        }}
      />
      <Drawer.Screen name="tax" options={{ title: 'Tax Calculator', drawerLabel: 'Calculator' }} />
      <Drawer.Screen name="tax/planning" options={{ title: 'Tax Planning', drawerLabel: 'Strategy Planner' }} />
      <Drawer.Screen name="tax/bulk-paye" options={{ title: 'Bulk PAYE', drawerLabel: 'Bulk Processing' }} />
      <Drawer.Screen name="wht-certificates" options={{ title: 'WHT Certificates', drawerLabel: 'WHT Certificates' }} />
      <Drawer.Screen name="subscription" options={{ title: 'Subscription', drawerLabel: 'Subscription' }} />
      <Drawer.Screen name="employees" options={{ title: 'Employee Management', drawerLabel: 'Employees' }} />
      <Drawer.Screen name="payroll" options={{ title: 'Payroll Dashboard', drawerLabel: 'Payroll' }} />
      <Drawer.Screen name="deadlines" options={{ title: 'Compliance Calendar', drawerLabel: 'Deadlines' }} />
      <Drawer.Screen name="notifications" options={{ title: 'Notifications', drawerLabel: 'Notifications' }} />
      <Drawer.Screen name="news" options={{ title: 'Tax News', drawerLabel: 'Tax News' }} />
      <Drawer.Screen name="history" options={{ title: 'Tax History', drawerLabel: 'History' }} />
      <Drawer.Screen
        name="tax-info/[type]"
        options={{
          title: 'Tax Law Information',
          drawerItemStyle: { display: 'none' }
        }}
      />
    </Drawer>
    </>
  );
}

const styles = StyleSheet.create({
  userProfile: {
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  menuContainer: {
    marginTop: 10,
  },
});
