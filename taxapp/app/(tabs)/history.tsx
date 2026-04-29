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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL, formatCurrency, COLORS } from '../../constants/tax';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { exportToPDF, exportToCSV, canExport } from '../../utils/taxExport';

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

export default function HistoryScreen() {
  const { refreshAccessToken } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const colors = useThemeColors();

  const fetchHistory = useCallback(async () => {
    try {
      const token = await refreshAccessToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const r = await axios.get(`${API_URL}/tax/history`, {
        headers: { Authorization: `Bearer ${token}` },
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
          <>
            <Text style={styles.exportBtnText}>📄 Export PDF</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.exportBtn, styles.exportBtnSecondary, { borderColor: colors.primary }]}
        onPress={() => handleExport('csv')}
        disabled={exporting}
      >
        <Text style={[styles.exportBtnTextSecondary, { color: colors.primary }]}>📊 Export CSV</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const color = TAX_TYPE_COLORS[item.taxType] || COLORS.primary;
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
      <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.typeText, { color }]}>
              {TAX_TYPE_NAMES[item.taxType] || item.taxType.toUpperCase()}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formattedDate}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formattedTime}</Text>
          </View>
        </View>
        <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
        <Text style={[styles.inputText, { color: colors.textSecondary }]}>
          {item.taxType === 'paye' && `Income: ${formatCurrency(item.input?.grossIncome)} (${item.input?.frequency || 'annual'})`}
          {item.taxType === 'vat' && `Revenue: ${formatCurrency(item.input?.revenue)} @ ${((item.input?.rate || 0.075) * 100).toFixed(1)}%`}
          {item.taxType === 'wht' && `Amount: ${formatCurrency(item.input?.amount)} (${item.input?.category})`}
          {item.taxType === 'cgt' && `Proceeds: ${formatCurrency(item.input?.disposalProceeds)}`}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No History Yet</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        Your tax calculations will appear here once you start calculating.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {items.length > 0 && renderExportButtons()}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyList: { flex: 1 },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '700' },
  dateContainer: { alignItems: 'flex-end' },
  dateText: { fontSize: 12 },
  timeText: { fontSize: 11 },
  summaryText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  inputText: { fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
  },
  exportBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  exportBtnTextSecondary: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
