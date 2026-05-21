import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface AppCardProps {
  children: React.ReactNode;
  title?: string;
  style?: any;
  variant?: 'default' | 'variant';
}

export const AppCard = ({ children, title, style, variant = 'default' }: AppCardProps) => {
  const colors = useThemeColors();

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: variant === 'default' ? colors.surface : colors.surfaceVariant,
        borderColor: colors.outline
      },
      style
    ]}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
