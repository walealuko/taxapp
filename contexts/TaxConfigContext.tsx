import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { TAX_INFO as DEFAULT_TAX_INFO, PAYE_BRACKETS as DEFAULT_PAYE_BRACKETS, type TaxInfo, type PAYEBracket } from '../constants/tax';

interface TaxConfigState {
  configs: Record<string, TaxInfo>;
  payeBrackets: PAYEBracket[];
  isLoading: boolean;
  lastUpdated: string | null;
}

interface TaxConfigContextType {
  configs: Record<string, TaxInfo>;
  payeBrackets: PAYEBracket[];
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const TaxConfigContext = createContext<TaxConfigContextType | undefined>(undefined);

const STORAGE_KEY = '@taxapp_config';

export function TaxConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TaxConfigState>({
    configs: DEFAULT_TAX_INFO,
    payeBrackets: DEFAULT_PAYE_BRACKETS,
    isLoading: true,
    lastUpdated: null,
  });

  const fetchConfig = useCallback(async () => {
    try {
      // 1. Fetch general configs
      const { data: configsData, error: configsError } = await supabase
        .from('tax_configs')
        .select('*');

      if (configsError) throw configsError;

      // 2. Fetch PAYE brackets (optional - using defaults if table doesn't exist)
      let payeBrackets = DEFAULT_PAYE_BRACKETS;
      try {
        const { data: bracketsData, error: bracketsError } = await supabase
          .from('tax_brackets')
          .select('*')
          .order('order', { ascending: true });

        if (bracketsError) {
          if (bracketsError.code === 'PGRST116' || bracketsError.message.includes('does not exist')) {
            console.log('Tax brackets table not found, using defaults');
          } else {
            console.error('Error fetching tax brackets:', bracketsError);
          }
        } else if (bracketsData) {
          payeBrackets = bracketsData.map((b: any) => ({
            range: `₦${b.min_income} - ₦${b.max_income}`,
            rate: `${b.rate * 100}%`,
            description: b.description,
          }));
        }
      } catch (e) {
        console.log('Using default PAYE brackets due to fetch error');
      }

      // Map backend data to frontend types
      const configs: Record<string, TaxInfo> = { ...DEFAULT_TAX_INFO };

      configsData.forEach((item: any) => {
        const type = item.tax_type?.toLowerCase();
        if (type && DEFAULT_TAX_INFO[type]) {
          configs[type] = {
            ...DEFAULT_TAX_INFO[type],
            title: item.title || DEFAULT_TAX_INFO[type].title,
            description: item.description || DEFAULT_TAX_INFO[type].description,
            law: item.law_reference || DEFAULT_TAX_INFO[type].law,
            rates: item.rate ? `${item.rate}%` : (item.rates_summary || DEFAULT_TAX_INFO[type].rates),
          };
        }
      });

      const newState = {
        configs,
        payeBrackets,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Error fetching tax config, using cache/defaults:', error);

      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setState({ ...JSON.parse(cached), isLoading: false });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <TaxConfigContext.Provider
      value={{
        configs: state.configs,
        payeBrackets: state.payeBrackets,
        isLoading: state.isLoading,
        refreshConfig: fetchConfig
      }}
    >
      {children}
    </TaxConfigContext.Provider>
  );
}

export function useTaxConfig() {
  const context = useContext(TaxConfigContext);
  if (context === undefined) {
    throw new Error('useTaxConfig must be used within a TaxConfigProvider');
  }
  return context;
}
