import { useEffect, useRef, useCallback, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createEncryptedStorage, type EncryptedStorage } from './useSessionEncryption';
import { useAuth } from '../contexts/AuthContext';

export type TaxType = 'paye' | 'vat' | 'wht' | 'cgt';

export interface DraftData {
  id: string;
  taxType: TaxType;
  inputs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastResult?: Record<string, unknown>;
}

export interface AutoSaveOptions {
  intervalMs?: number;    // Auto-save interval (default 5s)
  debounceMs?: number;     // Debounce on input change (default 2s)
  maxDrafts?: number;     // Max drafts to keep (default 10)
}

interface UseAutoSaveDraftsReturn {
  drafts: DraftData[];
  currentDraft: DraftData | null;
  saveDraft: (taxType: TaxType, inputs: Record<string, string>, result?: Record<string, unknown>) => Promise<void>;
  loadDraft: (draftId: string) => DraftData | null;
  deleteDraft: (draftId: string) => Promise<void>;
  clearAllDrafts: () => Promise<void>;
  getLatestDraftForType: (taxType: TaxType) => DraftData | null;
  isSaving: boolean;
}

const DRAFTS_KEY = 'tax_drafts';
const ENCRYPTED_DRAFTS_KEY = 'enc_tax_drafts';

export function useAutoSaveDrafts(options: AutoSaveOptions = {}): UseAutoSaveDraftsReturn {
  const { intervalMs = 5000, debounceMs = 2000, maxDrafts = 10 } = options;
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [currentDraft, setCurrentDraft] = useState<DraftData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const storageRef = useRef<EncryptedStorage | null>(null);
  const pendingDraftRef = useRef<{ taxType: TaxType; inputs: Record<string, string>; result?: Record<string, unknown> } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftsRef = useRef<DraftData[]>([]);

  // Keep draftsRef in sync with drafts state to avoid stale closures
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  // Initialize encrypted storage
  useEffect(() => {
    const initStorage = async () => {
      if (user) {
        storageRef.current = await createEncryptedStorage(user.id);
        await loadDrafts();
      }
    };
    initStorage();
  }, [user]);

  // Load drafts from encrypted storage
  const loadDrafts = async () => {
    if (!storageRef.current) return;
    try {
      const stored = await storageRef.current.getItem<DraftData[]>(DRAFTS_KEY);
      setDrafts(stored || []);
    } catch (e) {
      console.error('Failed to load drafts:', e);
      setDrafts([]);
    }
  };

  // Save drafts to encrypted storage
  const persistDrafts = async (draftList: DraftData[]) => {
    if (!storageRef.current) return;
    setIsSaving(true);
    try {
      await storageRef.current.setItem(DRAFTS_KEY, draftList);
      setDrafts(draftList);
    } catch (e) {
      console.error('Failed to save drafts:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Save a draft (debounced)
  const saveDraft = useCallback(async (
    taxType: TaxType,
    inputs: Record<string, string>,
    result?: Record<string, unknown>
  ) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Store pending draft
    pendingDraftRef.current = { taxType, inputs, result };

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      if (!pendingDraftRef.current || !storageRef.current) return;

      const { taxType: t, inputs: inp, result: res } = pendingDraftRef.current;
      pendingDraftRef.current = null;

      const now = new Date().toISOString();
      const currentDrafts = draftsRef.current;
      const existingDraft = currentDrafts.find(d => d.taxType === t);

      let updatedDrafts: DraftData[];

      if (existingDraft) {
        // Update existing draft
        updatedDrafts = currentDrafts.map(d =>
          d.id === existingDraft.id
            ? { ...d, inputs: inp, result: res, updatedAt: now }
            : d
        );
      } else {
        // Create new draft
        const newDraft: DraftData = {
          id: `${taxType}_${Date.now()}`,
          taxType,
          inputs: inp,
          createdAt: now,
          updatedAt: now,
          lastResult: res,
        };
        updatedDrafts = [newDraft, ...currentDrafts].slice(0, maxDrafts);
      }

      await persistDrafts(updatedDrafts);
    }, debounceMs);
  }, [debounceMs, maxDrafts]);

  // Load a specific draft
  const loadDraftFn = useCallback((draftId: string): DraftData | null => {
    return drafts.find(d => d.id === draftId) || null;
  }, [drafts]);

  // Get the latest draft for a tax type
  const getLatestDraftForType = useCallback((taxType: TaxType): DraftData | null => {
    return drafts.find(d => d.taxType === taxType) || null;
  }, [drafts]);

  // Delete a draft
  const deleteDraftFn = useCallback(async (draftId: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    await persistDrafts(updatedDrafts);
    if (currentDraft?.id === draftId) {
      setCurrentDraft(null);
    }
  }, [drafts, currentDraft]);

  // Clear all drafts
  const clearAllDraftsFn = useCallback(async () => {
    await persistDrafts([]);
    setCurrentDraft(null);
  }, []);

  // Auto-save timer (saves pending draft every intervalMs)
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(async () => {
      if (pendingDraftRef.current) {
        // Force save pending draft immediately
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        // Trigger save by updating pending (it will be saved in next cycle due to debounce)
        // Instead, directly save if we have a current draft
        if (currentDraft && pendingDraftRef.current) {
          const { taxType, inputs, result } = pendingDraftRef.current;
          const now = new Date().toISOString();
          const updatedDrafts = drafts.map(d =>
            d.id === currentDraft.id
              ? { ...d, inputs, result, updatedAt: now }
              : d
          );
          await persistDrafts(updatedDrafts);
        }
      }
    }, intervalMs);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [intervalMs, currentDraft, drafts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, []);

  return {
    drafts,
    currentDraft,
    saveDraft,
    loadDraft: loadDraftFn,
    deleteDraft: deleteDraftFn,
    clearAllDrafts: clearAllDraftsFn,
    getLatestDraftForType,
    isSaving,
  };
}

// Component that shows draft recovery UI
export default function useAutoSaveDraftsExport() {
  return { useAutoSaveDrafts };
}