import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export const NigerianFlag = () => {
  return (
    <View style={styles.container}>
      <Svg width="40" height="25" viewBox="0 0 3 2">
        <Rect x="0" y="0" width="1" height="2" fill="#008751" />
        <Rect x="1" y="0" width="1" height="2" fill="#fff" />
        <Rect x="2" y="0" width="1" height="2" fill="#008751" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
