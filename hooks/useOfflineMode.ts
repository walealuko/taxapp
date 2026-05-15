import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { PAYE_BRACKETS, WHT_CATEGORIES, TAX_INFO } from '../constants/tax';

interface PAYEBracket {
  min: number;
  max: number;
  rate: number;
  fixed: number;
}

interface CachedTaxData {
  brackets: PAYEBracket[];
  whtCategories: typeof WHT_CATEGORIES;
  taxInfo: typeof TAX_INFO;
  cachedAt: string;
}

interface UseOfflineModeReturn {
  isOffline: boolean;
  isLoading: boolean;
  lastCached: Date | null;
  calculateTaxOffline: (annualIncome: number) => number;
  calculateVatOffline: (revenue: number, rate?: number) => { vatAmount: number; netAmount: number };
  calculateWhtOffline: (amount: number, category: string) => { withholdingTax: number; netPayment: number };
  calculateCgtOffline: (disposalProceeds: number, costBase: number, expenses?: number) => { chargeableGain: number; capitalGainsTax: number };
  refreshCache: () => Promise<void>;
}

const CACHE_FILE_PATHS = {
  paye: `${FileSystem.documentDirectory}tax_paye_cache.json`,
  taxInfo: `${FileSystem.documentDirectory}tax_info_cache.json`,
  wht: `${FileSystem.documentDirectory}tax_wht_cache.json`,
};

const DEFAULT_PAYE_BRACKETS: PAYEBracket[] = [
  { min: 0, max: 300000, rate: 0, fixed: 0 },
  { min: 300001, max: 600000, rate: 0.07, fixed: 0 },
  { min: 600001, max: 1100000, rate: 0.11, fixed: 21000 },
  { min: 1100001, max: 1600000, rate: 0.15, fixed: 76000 },
  { min: 1600001, max: 2100000, rate: 0.19, fixed: 151000 },
  { min: 2100001, max: 2600000, rate: 0.21, fixed: 246000 },
  { min: 2600001, max: 3100000, rate: 0.24, fixed: 351000 },
  { min: 3100001, max: Infinity, rate: 0.24, fixed: 471000 },
];

export function useOfflineMode(): UseOfflineModeReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCached, setLastCached] = useState<Date | null>(null);
  const [cachedBrackets, setCachedBrackets] = useState<PAYEBracket[]>(DEFAULT_PAYE_BRACKETS);

  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return !networkState.isConnected;
    } catch {
      return true;
    }
  }, []);

  const loadCachedData = useCallback(async () => {
    try {
      if (!FileSystem.documentDirectory) return;
      const payeCachePath = CACHE_FILE_PATHS.paye;
      const content = await FileSystem.readAsStringAsync(payeCachePath);
      const data: CachedTaxData = JSON.parse(content);
      setCachedBrackets(data.brackets);
      setLastCached(new Date(data.cachedAt));
    } catch {
      await saveCacheData();
    }
  }, []);

  const saveCacheData = useCallback(async () => {
    try {
      if (!FileSystem.documentDirectory) return;
      const cacheData: CachedTaxData = {
        brackets: PAYE_BRACKETS,
        whtCategories: WHT_CATEGORIES,
        taxInfo: TAX_INFO,
        cachedAt: new Date().toISOString(),
      };
      const payeCachePath = CACHE_FILE_PATHS.paye;
      await FileSystem.writeAsStringAsync(payeCachePath, JSON.stringify(cacheData));
      setLastCached(new Date(cacheData.cachedAt));
    } catch (error) {
      console.warn('Failed to save tax cache data:', error);
    }
  }, []);

  const refreshCache = useCallback(async () => {
    const offline = await checkNetworkStatus();
    setIsOffline(offline);
    if (!offline) {
      await saveCacheData();
    }
  }, [checkNetworkStatus, saveCacheData]);

  const calculateTaxOffline = useCallback((annualIncome: number): number => {
    for (const bracket of cachedBrackets) {
      if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
        return (annualIncome - bracket.min) * bracket.rate + bracket.fixed;
      }
    }
    return 0;
  }, [cachedBrackets]);

  const calculateVatOffline = useCallback((revenue: number, rate: number = 0.075): { vatAmount: number; netAmount: number } => {
    const vatAmount = revenue * rate;
    const netAmount = revenue - vatAmount;
    return {
      vatAmount: Math.round(vatAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }, []);

  const WHT_RATES_MAP: Record<string, number> = {
    contractor: 0.05,
    dividend: 0.10,
    rent: 0.10,
    interest: 0.10,
    royalty: 0.15,
    professional: 0.05,
    director: 0.10,
  };

  const calculateWhtOffline = useCallback((amount: number, category: string): { withholdingTax: number; netPayment: number } => {
    const whtRate = WHT_RATES_MAP[category] || 0.05;
    const withholdingTax = amount * whtRate;
    const netPayment = amount - withholdingTax;
    return {
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      netPayment: Math.round(netPayment * 100) / 100,
    };
  }, []);

  const calculateCgtOffline = useCallback((disposalProceeds: number, costBase: number, expenses: number = 0): { chargeableGain: number; capitalGainsTax: number } => {
    const gain = disposalProceeds - costBase - expenses;
    const chargeableGain = Math.max(0, gain);
    const capitalGainsTax = Math.round(chargeableGain * 0.10 * 100) / 100;
    return { chargeableGain, capitalGainsTax };
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadCachedData();
      const offline = await checkNetworkStatus();
      setIsOffline(offline);
      setIsLoading(false);
    };
    init();
    const intervalId = setInterval(async () => {
      const offline = await checkNetworkStatus();
      setIsOffline(offline);
    }, 10000);
    return () => clearInterval(intervalId);
  }, [loadCachedData, checkNetworkStatus]);

  return { isOffline, isLoading, lastCached, calculateTaxOffline, calculateVatOffline, calculateWhtOffline, calculateCgtOffline, refreshCache };
}

export default useOfflineMode;
