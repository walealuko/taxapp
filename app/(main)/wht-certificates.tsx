import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WHT_CATEGORIES } from '@/constants/tax';
import { TYPOGRAPHY } from '@/constants/typography';
import { AppCard } from '@/components/ui/AppCard';
import { StandardInput } from '@/components/ui/StandardInput';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadCategory, setUploadCategory] = useState(WHT_CATEGORIES[0].name);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

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

  const totalCredits = certificates.reduce((sum, cert) => sum + cert.amount, 0);

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyCacheCachesAsynchronously: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to pick document: ' + err.message);
    }
  };

  const processUpload = async () => {
    if (!selectedFile || !uploadAmount) {
      Alert.alert('Missing Info', 'Please select a file and enter the amount');
      return;
    }

    setUploading(true);
    try {
      const file = selectedFile;
      const fileName = `${user?.id}_${Date.now()}_${file.name}`;
      const filePath = `certificates/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data: storageData, error: storageError } = await supabase.storage
        .from('certificates')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/pdf',
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('wht_certificates').insert({
        user_id: user?.id,
        file_url: publicUrl,
        file_name: file.name,
        amount: parseFloat(uploadAmount),
        category: uploadCategory,
      });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Certificate uploaded successfully');
      setModalVisible(false);
      setSelectedFile(null);
      setUploadAmount('');
      await fetchCertificates();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>WHT Certificates</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Manage and upload your Withholding Tax certificates
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <AppCard variant="primary" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total WHT Credits</Text>
              <Text style={styles.summaryCount}>₦{totalCredits.toLocaleString()}</Text>
              <Text style={styles.summarySubtext}>Available to offset CIT/PAYE liability</Text>
            </View>
          </AppCard>

          <TouchableOpacity
            style={[styles.uploadCard, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
            disabled={uploading}
          >
            <MaterialCommunityIcons name="cloud-upload" size={40} color="#fff" />
            <Text style={[styles.uploadText, { color: '#fff', ...TYPOGRAPHY.heading }]}>Upload New Certificate</Text>
            <Text style={[styles.uploadSubtext, { color: 'rgba(255,255,255,0.7)', ...TYPOGRAPHY.caption }]}>PDF, JPG or PNG (Max 5MB)</Text>
            {uploading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Your Certificates</Text>

          {certificates.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>No certificates uploaded yet.</Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <AppCard key={cert.id} variant="default" style={styles.certCard}>
                <View style={styles.certRow}>
                  <View style={[styles.certIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.certDetails}>
                    <Text style={[styles.certName, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{cert.file_name}</Text>
                    <Text style={[styles.certMeta, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                      {new Date(cert.created_at).toLocaleDateString()} • {cert.category} • ₦{cert.amount.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.surfaceVariant }]}>
                    <MaterialCommunityIcons name="download" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Upload WHT Certificate</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Category</Text>
              <View style={styles.categoryRow}>
                {WHT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: uploadCategory === cat.name ? cat.color : colors.surfaceVariant,
                        borderColor: uploadCategory === cat.name ? cat.color : 'transparent',
                      }
                    ]}
                    onPress={() => setUploadCategory(cat.name)}
                  >
                    <Text style={[styles.categoryChipText, { color: uploadCategory === cat.name ? '#fff' : colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <StandardInput
                label="Certificate Amount (₦)"
                value={uploadAmount}
                onChangeText={setUploadAmount}
                placeholder="0.00"
                keyboardType="numeric"
                colors={colors}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Document</Text>
              <TouchableOpacity
                style={[styles.filePicker, { borderColor: selectedFile ? colors.primary : colors.outline, backgroundColor: colors.surfaceVariant }]}
                onPress={pickFile}
              >
                <MaterialCommunityIcons name="file-upload" size={24} color={colors.primary} />
                <Text style={[styles.filePickerText, { color: colors.text, ...TYPOGRAPHY.body }]}>
                  {selectedFile ? selectedFile.name : 'Select PDF Certificate'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.btnCancelText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                onPress={processUpload}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnSaveText, { ...TYPOGRAPHY.body, fontWeight: '600' }]}>Upload</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
  },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  summaryCard: {
    marginBottom: 20,
  },
  summaryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  summaryLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryCount: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  summarySubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  uploadText: { marginTop: 12, textAlign: 'center' },
  uploadSubtext: { marginTop: 4, textAlign: 'center' },
  sectionTitle: { marginBottom: 16 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 12 },
  certCard: {
    marginBottom: 12,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certDetails: { flex: 1 },
  certName: { marginBottom: 2 },
  certMeta: { fontSize: 14 },
  downloadBtn: {
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
  },
  modalTitle: { marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { marginBottom: 8 },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: { fontWeight: '600' },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  filePickerText: { flex: 1 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 32,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  btnCancel: { },
  btnCancelText: { },
  btnSave: { alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#fff' },
});
