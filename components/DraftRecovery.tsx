import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useAutoSaveDrafts, type DraftData } from '../hooks/useAutoSaveDrafts';
import { COLORS, formatCurrency } from '../constants/tax';

interface DraftRecoveryProps {
  taxType: string;
  visible: boolean;
  onClose: () => void;
  onRecover: (draft: DraftData) => void;
}

export default function DraftRecovery({ taxType, visible, onClose, onRecover }: DraftRecoveryProps) {
  const { drafts, deleteDraft, clearAllDrafts, getLatestDraftForType } = useAutoSaveDrafts();
  const typeDrafts = drafts.filter(d => d.taxType === taxType);

  if (typeDrafts.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPreview = (inputs: Record<string, string>): string => {
    const values = Object.values(inputs).filter(Boolean);
    if (values.length === 0) return 'Empty';
    return values.slice(0, 2).join(', ');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📄 Recover Draft</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            You have {typeDrafts.length} saved draft{typeDrafts.length > 1 ? 's' : ''} for {taxType.toUpperCase()}
          </Text>

          <ScrollView style={styles.draftList}>
            {typeDrafts.map((draft) => (
              <View key={draft.id} style={styles.draftItem}>
                <View style={styles.draftInfo}>
                  <Text style={styles.draftDate}>{formatDate(draft.updatedAt)}</Text>
                  <Text style={styles.draftPreview}>{formatPreview(draft.inputs)}</Text>
                  {draft.lastResult && (
                    <Text style={styles.draftResult}>
                      Last: {formatCurrency(draft.lastResult.annualTax || draft.lastResult.vatAmount || draft.lastResult.withholdingTax || draft.lastResult.capitalGainsTax || 0)}
                    </Text>
                  )}
                </View>
                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={styles.recoverBtn}
                    onPress={() => {
                      onRecover(draft);
                      onClose();
                    }}
                  >
                    <Text style={styles.recoverBtnText}>Recover</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert(
                        'Delete Draft',
                        'Are you sure you want to delete this draft?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteDraft(draft.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={() => {
              Alert.alert(
                'Clear All Drafts',
                'This will delete all saved drafts. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                      clearAllDrafts();
                      onClose();
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.clearAllBtnText}>Clear All Drafts</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 16,
  },
  draftList: {
    maxHeight: 300,
  },
  draftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    marginBottom: 8,
  },
  draftInfo: {
    flex: 1,
  },
  draftDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  draftPreview: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  draftResult: {
    fontSize: 11,
    color: COLORS.success,
    marginTop: 2,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoverBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  recoverBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  clearAllBtn: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  clearAllBtnText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
});