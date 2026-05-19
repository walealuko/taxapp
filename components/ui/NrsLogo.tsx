import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS as TaxColors } from '../../constants/tax';

export const NrsLogo = () => {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.circle}>
        <Text style={styles.logoText}>NRS</Text>
      </View>
      <View style={styles.accentLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#008751', // Nigerian Green
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  accentLine: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginLeft: 4,
  },
});
