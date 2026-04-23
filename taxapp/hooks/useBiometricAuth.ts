import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

interface BiometricResult {
  success: boolean;
  error?: string;
}

interface UseBiometricAuthReturn {
  isBiometricAvailable: boolean;
  biometricType: 'facial' | 'fingerprint' | 'iris' | 'none';
  isBiometricEnabled: boolean;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticate: (reason?: string) => Promise<BiometricResult>;
  checkBiometricAvailability: () => Promise<boolean>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'facial' | 'fingerprint' | 'iris' | 'none'>('none');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const checkBiometricAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsBiometricAvailable(hasHardware && isEnrolled);

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('facial');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
      } else {
        setBiometricType('none');
      }

      return hasHardware && isEnrolled;
    } catch (e) {
      console.error('Biometric check failed:', e);
      return false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkBiometricAvailability();
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === 'true');
    };
    init();
  }, [checkBiometricAvailability]);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // Verify user can authenticate first before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        setIsBiometricEnabled(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to enable biometric:', e);
      return false;
    }
  }, []);

  const disableBiometric = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    setIsBiometricEnabled(false);
  }, []);

  const authenticate = useCallback(async (reason: string = 'Authenticate to continue'): Promise<BiometricResult> => {
    if (!isBiometricAvailable) {
      return { success: false, error: 'Biometric not available' };
    }

    try {
      // Check if device has security
      const securityLevel = await LocalAuthentication.getPlatformLevelAsync();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: Platform.OS === 'ios', // iOS allows passcode fallback, Android doesn't
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        return { success: true };
      }

      return { success: false, error: result.error || 'Authentication failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication failed' };
    }
  }, [isBiometricAvailable]);

  return {
    isBiometricAvailable,
    biometricType,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    authenticate,
    checkBiometricAvailability,
  };
}

// Quick helper to check if user should use biometric auth on app launch
export async function shouldUseBiometricAuth(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return enabled === 'true';
}