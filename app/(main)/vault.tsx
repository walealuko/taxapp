import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { StandardInput } from '../../components/ui/StandardInput';

interface CompanyDocument {
  id: string;
  created_at: string;
  file_url: string;
  file_name: string;
  document_type: string;
}

const DOC_TYPES = [
  { id: 'cac', label: 'CAC Certificate', icon: 'file-certificate' },
  { id: 'tin', label: 'TIN Document', icon: 'numeric' },
  { id: 'mop', label: 'Proof of Address', icon: 'map-marker' },
  { id: 'other', label: 'Other Legal', icon: 'file-document-outline' },
];

export default function CompanyVaultScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0].id);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to pick document: ' + err.message);
    }
  };

  const processUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Missing File', 'Please select a document to upload');
      return;
    }

    setUploading(true);
    try {
      const file = selectedFile;
      const fileName = `${user?.id}_${Date.now()}_${file.name}`;
      const filePath = `company-docs/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: storageError } = await supabase.storage
        .from('company-docs')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/pdf',
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-docs')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('company_documents').insert({
        user_id: user?.id,
        file_url: publicUrl,
        file_name: file.name,
        document_type: selectedType,
      });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Document uploaded successfully');
      setModalVisible(false);
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Company Vault</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          Securely store your business legal documents and certificates.
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
            <MaterialCommunityIcons name="shield-lock" size={40} color="#fff" />
            <Text style={[styles.uploadText, { color: '#fff', ...TYPOGRAPHY.heading }]}>Add Legal Document</Text>
            <Text style={[styles.uploadSubtext, { color: 'rgba(255,255,255,0.7)', ...TYPOGRAPHY.caption }]}>PDF, JPG or PNG (Max 5MB)</Text>
            {uploading && <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Stored Documents</Text>

          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="folder-open-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>Your vault is empty.</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>Upload your CAC and TIN documents here.</Text>
            </View>
          ) : (
            documents.map((doc) => (
              <AppCard key={doc.id} variant="default" style={styles.certCard}>
                <View style={styles.certRow}>
                  <View style={[styles.certIcon, { backgroundColor: colors.surfaceVariant }]}>
                    <MaterialCommunityIcons
                      name={DOC_TYPES.find(t => t.id === doc.document_type)?.icon || 'file-document-outline'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.certDetails}>
                    <Text style={[styles.certName, { color: colors.text, ...TYPOGRAPHY.body, fontWeight: '600' }]}>{doc.file_name}</Text>
                    <Text style={[styles.certMeta, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                      {new Date(doc.created_at).toLocaleDateString()} • {DOC_TYPES.find(t => t.id === doc.document_type)?.label || 'Other'}
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
            <Text style={[styles.modalTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Add to Vault</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Document Type</Text>
              <View style={styles.categoryRow}>
                {DOC_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedType === type.id ? colors.primary : colors.surfaceVariant,
                        borderColor: selectedType === type.id ? colors.primary : 'transparent',
                      }
                    ]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Text style={[styles.categoryChipText, { color: selectedType === type.id ? '#fff' : colors.textSecondary, ...TYPOGRAPHY.caption }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  uploadCard: {
    borderRadius: 20,
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
  uploadText: { marginTop: 12, textAlign: 'center' },
  uploadSubtext: { marginTop: 4, textAlign: 'center' },
  sectionTitle: { marginBottom: 16 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 12 },
  emptySubtext: { fontSize: 12, textAlign: 'center', marginTop: 4 },
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
  certMeta: { fontSize: 12 },
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
