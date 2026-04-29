import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { COLORS } from '../constants/tax';

export function NetworkStatusBanner() {
  const { isOffline, isLoading } = useOfflineMode();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !isOffline || dismissed) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="You are offline">
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>You're offline. Using cached data.</Text>
      <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export function NetworkStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { isOffline, isLoading } = useOfflineMode();

  if (isLoading) return null;

  if (compact) {
    return (
      <View style={[styles.indicator, isOffline && styles.indicatorOffline]}>
        <View style={[styles.dot, isOffline ? styles.dotOffline : styles.dotOnline]} />
        <Text style={[styles.indicatorText, isOffline && styles.indicatorTextOffline]}>
          {isOffline ? 'Offline' : 'Online'}
        </Text>
      </View>
    );
  }

  return (
    <NetworkStatusBanner />
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    color: '#fff',
    fontSize: 16,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  indicatorOffline: {
    backgroundColor: '#FF980020',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
  },
  dotOffline: {
    backgroundColor: '#FF9800',
  },
  indicatorText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  indicatorTextOffline: {
    color: '#FF9800',
  },
});