import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../constants/tax';
import { formatCurrency } from '../../utils/taxCalculations';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { exportToPDF, exportToCSV, canExport } from '../../utils/taxExport';
import { TYPOGRAPHY } from '../../constants/typography';
import { AppCard } from '../../components/ui/AppCard';
import { StandardInput } from '../../components/ui/StandardInput';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type HistoryItem = {
  _id: string;
  taxType: string;
  input: Record<string, any>;
  result: Record<string, any>;
  createdAt: string;
};

const TAX_TYPE_NAMES: Record<string, string> = {
  paye: 'PAYE',
  vat: 'VAT',
  wht: 'WHT',
  cgt: 'CGT',
};

const TAX_TYPE_COLORS: Record<string, string> = {
  paye: '#FF6B6B',
  vat: '#4CAF50',
  wht: '#FFB74D',
  cgt: '#29B6F6',
};

type FormState = {
  taxType: string;
  input: Record<string, any>;
  result: Record<string, any>;
};

export default function HistoryScreen() {
  const { refreshAccessToken } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    taxType: 'paye',
    input: {},
    result: {},
  });
  const colors = useThemeColors();

  const fetchHistory = useCallback(async () => {
    try {
      const token = await refreshAccessToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const r = await axios.get(`${API_URL}/tax_history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
      setItems(r.data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load history');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshAccessToken]);

  const handleSaveRecord = async () => {
    try {
      const token = await refreshAccessToken();
      if (!token) throw new Error('No auth token');

      const payload = {
        taxType: formData.taxType,
        input: formData.input,
        result: formData.result,
      };

      if (isEditing && currentId) {
        await axios.put(`${API_URL}/tax_history/${currentId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        });
      } else {
        await axios.post(`${API_URL}/tax_history`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        });
      }

      Alert.alert('Success', `Record ${isEditing ? 'updated' : 'added'} successfully`);
      setModalVisible(false);
      fetchHistory();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save record');
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ taxType: 'paye', input: {}, result: {} });
    setModalVisible(true);
  };

  const openEditModal = (item: HistoryItem) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setFormData({
      taxType: item.taxType,
      input: item.input,
      result: item.result,
    });
    setModalVisible(true);
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (items.length === 0) {
      Alert.alert('No Data', 'No calculations to export');
      return;
    }

    const canShare = await canExport();
    if (!canShare) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return;
    }

    setExporting(true);
    try {
      const results = items.map(item => ({
        taxType: item.taxType,
        createdAt: item.createdAt,
        ...item.result,
      }));

      if (format === 'pdf') {
        await exportToPDF({
          title: 'TaxApp Nigeria - Tax Calculation History',
          results,
        });
      } else {
        await exportToCSV({
          title: 'TaxApp Nigeria - Tax Calculation History',
          results,
        });
      }
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const renderExportButtons = () => (
    <View style={styles.exportContainer}>
      <TouchableOpacity
        style={[styles.exportBtn, { backgroundColor: colors.primary }]}
        onPress={() => handleExport('pdf')}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.btnContent}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.exportBtn, styles.exportBtnSecondary, { borderColor: colors.primary }]}
        onPress={() => handleExport('csv')}
        disabled={exporting}
      >
        <View style={styles.btnContent}>
          <MaterialCommunityIcons name="file-table" size={20} color={colors.primary} />
          <Text style={[styles.exportBtnTextSecondary, { color: colors.primary }]}>Export CSV</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderRecordModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>
            {isEditing ? 'Edit Record' : 'Add Tax Record'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text, ...TYPOGRAPHY.caption, fontWeight: '600' }]}>Tax Type</Text>
            <View style={styles.typeRow}>
              {Object.entries(TAX_TYPE_NAMES).map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.typeChip,
                    { backgroundColor: formData.taxType === id ? colors.primary : colors.surfaceVariant }
                  ]}
                  onPress={() => setFormData({ ...formData, taxType: id })}
                >
                  <Text style={[styles.typeChipText, { color: formData.taxType === id ? '#fff' : colors.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={styles.formScroll}>
            {formData.taxType === 'paye' && (
              <>
                <StandardInput
                  label="Gross Annual Income"
                  value={formData.input?.grossIncome?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, grossIncome: v } })}
                  keyboardType="numeric"
                />
                <StandardInput
                  label="Frequency"
                  placeholder="e.g. Monthly, Annual"
                  value={formData.input?.frequency || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, frequency: v } })}
                />
                <StandardInput
                  label="Annual Tax Amount"
                  value={formData.result?.annualTax?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, result: { ...formData.result, annualTax: v } })}
                  keyboardType="numeric"
                />
              </>
            )}
            {formData.taxType === 'vat' && (
              <>
                <StandardInput
                  label="Total Revenue"
                  value={formData.input?.revenue?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, revenue: v } })}
                  keyboardType="numeric"
                />
                <StandardInput
                  label="VAT Rate (%)"
                  value={formData.input?.rate?.toString() || '7.5'}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, rate: v } })}
                  keyboardType="numeric"
                />
                <StandardInput
                  label="VAT Amount"
                  value={formData.result?.vatAmount?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, result: { ...formData.result, vatAmount: v } })}
                  keyboardType="numeric"
                />
              </>
            )}
            {formData.taxType === 'wht' && (
              <>
                <StandardInput
                  label="Transaction Amount"
                  value={formData.input?.amount?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, amount: v } })}
                  keyboardType="numeric"
                />
                <StandardInput
                  label="Category"
                  placeholder="e.g. Professional Services"
                  value={formData.input?.category || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, category: v } })}
                />
                <StandardInput
                  label="WHT Amount"
                  value={formData.result?.withholdingTax?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, result: { ...formData.result, withholdingTax: v } })}
                  keyboardType="numeric"
                />
              </>
            )}
            {formData.taxType === 'cgt' && (
              <>
                <StandardInput
                  label="Disposal Proceeds"
                  value={formData.input?.disposalProceeds?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, input: { ...formData.input, disposalProceeds: v } })}
                  keyboardType="numeric"
                />
                <StandardInput
                  label="Capital Gains Tax"
                  value={formData.result?.capitalGainsTax?.toString() || ''}
                  onChangeText={(v) => setFormData({ ...formData, result: { ...formData.result, capitalGainsTax: v } })}
                  keyboardType="numeric"
                />
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalBtnTextCancel, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: colors.primary }]}
              onPress={handleSaveRecord}
            >
              <Text style={[styles.modalBtnTextSave, { color: '#fff' }]}>Save Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  const renderItem = ({ item }: { item: HistoryItem }) => {
    const color = TAX_TYPE_COLORS[item.taxType] || colors.primary;
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let summary = '';
    if (item.taxType === 'paye') {
      summary = `Annual Tax: ${formatCurrency(item.result?.annualTax)}`;
    } else if (item.taxType === 'vat') {
      summary = `VAT: ${formatCurrency(item.result?.vatAmount)}`;
    } else if (item.taxType === 'wht') {
      summary = `WHT: ${formatCurrency(item.result?.withholdingTax)}`;
    } else if (item.taxType === 'cgt') {
      summary = `CGT: ${formatCurrency(item.result?.capitalGainsTax)}`;
    }

    return (
      <AppCard
        variant="default"
        style={styles.historyCard}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeText, { color, ...TYPOGRAPHY.caption }]}>
              {TAX_TYPE_NAMES[item.taxType] || item.taxType.toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editAction}>
              <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{formattedDate}</Text>
              <Text style={[styles.timeText, { color: colors.textSecondary, ...TYPOGRAPHY.caption }]}>{formattedTime}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.summaryText, { color: colors.text, ...TYPOGRAPHY.heading }]}>{summary}</Text>
        <Text style={[styles.inputText, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
          {item.taxType === 'paye' && `Income: ${formatCurrency(item.input?.grossIncome)} (${item.input?.frequency || 'annual'})`}
          {item.taxType === 'vat' && `Revenue: ${formatCurrency(item.input?.revenue)} @ ${((item.input?.rate || 0.075) * 100).toFixed(1)}%`}
          {item.taxType === 'wht' && `Amount: ${formatCurrency(item.input?.amount)} (${item.input?.category})`}
          {item.taxType === 'cgt' && `Proceeds: ${formatCurrency(item.input?.disposalProceeds)}`}
        </Text>
      </AppCard>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>No History Yet</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
        Your tax calculations will appear here once you start calculating.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text, ...TYPOGRAPHY.heading }]}>Tax History</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary, ...TYPOGRAPHY.body }]}>
            Your detailed tax calculation records
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={openAddModal}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {items.length > 0 && renderExportButtons()}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
      {renderRecordModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyList: { flex: 1 },
  historyCard: {
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editAction: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontWeight: '700' },
  dateContainer: { alignItems: 'flex-end' },
  dateText: { textAlign: 'right' },
  timeText: { textAlign: 'right' },
  summaryText: { fontWeight: '600', marginBottom: 4 },
  inputText: { lineHeight: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { textAlign: 'center', marginBottom: 8 },
  emptyDesc: { textAlign: 'center', lineHeight: 20 },
  exportContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  exportBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  exportBtnTextSecondary: { fontSize: 15, fontWeight: '600' },
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipText: { fontWeight: '600', fontSize: 12 },
  formScroll: { maxHeight: '60%' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 32,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalBtnSave: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextCancel: { fontSize: 15 },
  modalBtnTextSave: { fontWeight: '600', fontSize: 15 },
});
