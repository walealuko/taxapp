import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const NigeriaMap = () => {
  return (
    <View style={styles.container}>
      <Svg width="120" height="120" viewBox="0 0 100 100">
        <Path
          d="M30,20 L70,20 L80,40 L70,60 L50,80 L30,60 L20,40 Z"
          fill="#008751"
          stroke="#fff"
          strokeWidth="1"
          opacity="0.6"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
