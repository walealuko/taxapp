import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { documentDirectory } from 'expo-file-system/legacy';
import { useThemeColors } from '../hooks/useThemeColors';

interface ReceiptCaptureProps {
  onReceiptCaptured?: (uri: string) => void;
}

export default function ReceiptCapture({ onReceiptCaptured }: ReceiptCaptureProps) {
  const colors = useThemeColors();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(null);

  const requestPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and media library permissions are needed to capture receipts.');
      return false;
    }
    return true;
  };

  const captureFromCamera = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSavedUri(result.assets[0].uri);
        onReceiptCaptured?.(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setSavedUri(result.assets[0].uri);
        onReceiptCaptured?.(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetCapture = () => {
    setImageUri(null);
    setSavedUri(null);
  };

  if (imageUri) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBg }]}>
        <View style={[styles.successCard, { borderColor: colors.primary }]}>
          <View style={styles.successHeader}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={[styles.successTitle, { color: colors.text }]}>Receipt Captured</Text>
          </View>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          <Text style={[styles.savedPathText, { color: colors.textSecondary }]} numberOfLines={1}>
            {savedUri}
          </Text>
          <TouchableOpacity style={[styles.resetButton, { borderColor: colors.border }]} onPress={resetCapture}>
            <Text style={[styles.resetButtonText, { color: colors.text }]}>Capture Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg }]}>
      <View style={styles.captureOptions}>
        <Text style={[styles.captureTitle, { color: colors.text }]}>Capture Receipt</Text>
        <Text style={[styles.captureSubtitle, { color: colors.textSecondary }]}>
          Take a photo or select from gallery
        </Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Processing...</Text>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.primary }]}
              onPress={captureFromCamera}
              activeOpacity={0.8}
            >
              <Text style={styles.captureButtonEmoji}>📷</Text>
              <Text style={styles.captureButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.success }]}
              onPress={pickFromGallery}
              activeOpacity={0.8}
            >
              <Text style={styles.captureButtonEmoji}>🖼️</Text>
              <Text style={styles.captureButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16 },
  captureOptions: { alignItems: 'center' },
  captureTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  captureSubtitle: { fontSize: 13, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  captureButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  captureButtonEmoji: { fontSize: 20, marginRight: 8 },
  captureButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { marginTop: 8, fontSize: 14 },
  successCard: { borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center' },
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  successEmoji: { fontSize: 24, marginRight: 8 },
  successTitle: { fontSize: 18, fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  savedPathText: { fontSize: 11, marginBottom: 16 },
  resetButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  resetButtonText: { fontSize: 14, fontWeight: '500' },
});
