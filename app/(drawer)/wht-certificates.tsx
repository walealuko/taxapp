import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WHT_CATEGORIES } from '../../constants/tax';

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

      // 1. Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file.uri); // This might not work directly with Supabase JS client

      // Actually, for Supabase JS client, we use supabase.storage.from().upload()
      // We need to convert the URI to a blob or arrayBuffer
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data: storageData, error: storageError } = await supabase.storage
        .from('certificates')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/pdf',
          upsert: false,
        });

      if (storageError) throw storageError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      // 3. Save to database
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
            onPress={() => setModalVisible(true)}
            disabled={uploading}
          >
            <MaterialCommunityIcons name="cloud-upload" size={40} color="#fff" />
            <Text style={styles.uploadText}>Upload New Certificate</Text>
            <Text style={styles.uploadSubtext}>PDF, JPG or PNG (Max 5MB)</Text>
            {uploading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
          </TouchableOpacity>>

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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Upload WHT Certificate</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryRow}>
                {WHT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: uploadCategory === cat.name ? cat.color : colors.lightGray,
                        borderColor: uploadCategory === cat.name ? cat.color : 'transparent',
                      }
                    ]}
                    onPress={() => setUploadCategory(cat.name)}
                  >
                    <Text style={[styles.categoryChipText, { color: uploadCategory === cat.name ? '#fff' : colors.textSecondary }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Certificate Amount (₦)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                keyboardType="numeric"
                value={uploadAmount}
                onChangeText={setUploadAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Document</Text>
              <TouchableOpacity
                style={[styles.filePicker, { borderColor: selectedFile ? colors.primary : colors.border }]}
                onPress={pickFile}
              >
                <MaterialCommunityIcons name="file-upload" size={24} color={colors.primary} />
                <Text style={[styles.filePickerText, { color: colors.text }]}>
                  {selectedFile ? selectedFile.name : 'Select PDF Certificate'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                onPress={processUpload}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Upload</Text>}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
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
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  filePickerText: { fontSize: 14 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  btnCancel: { backgroundColor: '#eee' },
  btnCancelText: { color: '#666' },
  btnSave: { alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#fff' },
});
