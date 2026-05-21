import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WHTCertificate {
  id: string;
  created_at: string;
  file_url: string;
  file_name: string;
  amount: number;
  category: string;
}

export default function WHTCertificatesScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<WHTCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wht_certificates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  const handleUpload = async () => {
    // Note: In a real app, use expo-document-picker
    setUploading(true);
    try {
      // Simulating a file upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert('Success', 'Certificate uploaded successfully (Simulation)');
      await fetchCertificates();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>WHT Certificates</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Manage and upload your Withholding Tax certificates
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.uploadCard, { backgroundColor: colors.primary }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            <MaterialCommunityIcons name="cloud-upload" size={40} color="#fff" />
            <Text style={styles.uploadText}>Upload New Certificate</Text>
            <Text style={styles.uploadSubtext}>PDF, JPG or PNG (Max 5MB)</Text>
            {uploading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Certificates</Text>

          {certificates.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No certificates uploaded yet.</Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <View key={cert.id} style={[styles.certCard, { backgroundColor: colors.surface }]}>
                <View style={styles.certIcon}>
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                </View>
                <View style={styles.certDetails}>
                  <Text style={[styles.certName, { color: colors.text }]}>{cert.file_name}</Text>
                  <Text style={[styles.certMeta, { color: colors.textSecondary }]}>
                    {new Date(cert.created_at).toLocaleDateString()} • {cert.category}
                  </Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn}>
                  <MaterialCommunityIcons name="download" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  uploadCard: {
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  uploadText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  uploadSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certDetails: { flex: 1 },
  certName: { fontSize: 15, fontWeight: '600' },
  certMeta: { fontSize: 12, marginTop: 2 },
  downloadBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
});
