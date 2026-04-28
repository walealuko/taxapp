import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/tax';

const { width } = Dimensions.get('window');

interface NigeriaMapProps {
  showRegions?: boolean;
  highlightedRegion?: string;
  onRegionPress?: (region: string) => void;
}

const REGIONS = [
  { id: 'nw', name: 'North West', states: ['Kano', 'Katsina', 'Sokoto', 'Kebbi', 'Zamfara', 'Jigawa'], color: '#E8F5E9' },
  { id: 'ne', name: 'North East', states: ['Borno', 'Yobe', 'Gombe', 'Bauchi', 'Adamawa', 'Taraba'], color: '#FFF3E0' },
  { id: 'nc', name: 'North Central', states: ['Plateau', 'Niger', 'Benue', 'Kogi', 'Kwara', 'Nasarawa'], color: '#E3F2FD' },
  { id: 'sw', name: 'South West', states: ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ekiti', 'Ondo'], color: '#F3E5F5' },
  { id: 'se', name: 'South East', states: ['Enugu', 'Anambra', 'Imo', 'Ebonyi', 'Abia', 'Rivers'], color: '#FBE9E7' },
  { id: 'ss', name: 'South South', states: ['Delta', 'Bayelsa', 'Rivers', 'Cross River', 'Akwa Ibom', 'Edo'], color: '#E0F7FA' },
];

export default function NigeriaMap({ showRegions = true, highlightedRegion, onRegionPress }: NigeriaMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {/* Simplified Nigeria map shape using rectangles and circles */}
        <View style={styles.mapWrapper}>
          {/* Northern region */}
          <View style={styles.northernRegion}>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'nw' ? '#4CAF50' : '#A5D6A7' }]}>
              <Text style={styles.regionText}>NW</Text>
            </View>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'ne' ? '#FF9800' : '#FFCC80' }]}>
              <Text style={styles.regionText}>NE</Text>
            </View>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'nc' ? '#2196F3' : '#90CAF9' }]}>
              <Text style={styles.regionText}>NC</Text>
            </View>
          </View>

          {/* Central marker */}
          <View style={styles.capitalMarker}>
            <View style={styles.capitalDot} />
            <Text style={styles.capitalLabel}>Abuja</Text>
          </View>

          {/* Southern region */}
          <View style={styles.southernRegion}>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'sw' ? '#9C27B0' : '#CE93D8' }]}>
              <Text style={styles.regionText}>SW</Text>
            </View>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'se' ? '#F44336' : '#EF9A9A' }]}>
              <Text style={styles.regionText}>SE</Text>
            </View>
            <View style={[styles.regionBlock, { backgroundColor: highlightedRegion === 'ss' ? '#00BCD4' : '#80DEEA' }]}>
              <Text style={styles.regionText}>SS</Text>
            </View>
          </View>
        </View>

        {/* FIRS branding */}
        <View style={styles.firsBadge}>
          <Text style={styles.firsText}>🇳🇬 Nigeria Tax App</Text>
        </View>
      </View>

      {showRegions && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Tax Regions</Text>
          <View style={styles.legendGrid}>
            {REGIONS.map((region) => (
              <View
                key={region.id}
                style={[styles.legendItem, { borderLeftColor: region.color }]}
                onTouchEnd={() => onRegionPress?.(region.id)}
              >
                <View style={[styles.legendDot, { backgroundColor: region.color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendName}>{region.name}</Text>
                  <Text style={styles.legendStates}>{region.states.slice(0, 3).join(', ')}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.firsInfo}>
        <Text style={styles.firsInfoTitle}>🇳🇬 Powered by FIRS Guidelines</Text>
        <Text style={styles.firsInfoSubtitle}>Federal Inland Revenue Service</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16 },
  mapContainer: { alignItems: 'center' },
  mapWrapper: {
    width: width * 0.6,
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  northernRegion: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  southernRegion: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  regionBlock: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  regionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  capitalMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    alignItems: 'center',
  },
  capitalDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
  capitalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 2,
  },
  firsBadge: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  firsText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  legendContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendTextContainer: { flex: 1 },
  legendName: { fontSize: 12, fontWeight: '600', color: COLORS.dark },
  legendStates: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  firsInfo: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  firsInfoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  firsInfoSubtitle: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
});