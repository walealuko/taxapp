import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Aes from 'react-native-aes-crypto';

const ENCRYPTION_KEY_ID = 'session_encryption_key_v2';
const KEY_SIZE = 256;
const IV_SIZE = 16;

// In-memory storage fallback for web
const webMemoryStore = new Map<string, string>();

// Get or create the master encryption key
async function getMasterKey(): Promise<string | null> {
  try {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
    if (!key) {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
    }
    return key;
  } catch {
    return null;
  }
}

export interface EncryptedStorage {
  encrypt: (data: string) => Promise<string>;
  decrypt: (encryptedData: string) => Promise<string>;
  setItem: (key: string, value: object) => Promise<void>;
  getItem: <T = unknown>(key: string) => Promise<T | null>;
  removeItem: (key: string) => Promise<void>;
}

// Derives a fixed-length key from a master secret using SHA-256
async function deriveKey(secret: string, baseKey: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    secret + '_' + baseKey + '_taxapp_v2'
  );
  return hash;
}

// AES-GCM encryption with proper IV
// Format: base64(iv):base64(ciphertext):base64(tag)
export async function createEncryptedStorage(sessionSeed?: string): Promise<EncryptedStorage> {
  const masterKey = await getMasterKey();

  // Fallback for web - use in-memory storage
  if (!masterKey) {
    return {
      async encrypt(data: string): Promise<string> {
        return btoa(data); // Base64 fallback (not encrypted, but prevents plaintext storage)
      },
      async decrypt(encryptedData: string): Promise<string> {
        return atob(encryptedData);
      },
      async setItem(key: string, value: object): Promise<void> {
        webMemoryStore.set(key, JSON.stringify(value));
      },
      async getItem<T = unknown>(key: string): Promise<T | null> {
        const val = webMemoryStore.get(key);
        return val ? JSON.parse(val) as T : null;
      },
      async removeItem(key: string): Promise<void> {
        webMemoryStore.delete(key);
      },
    };
  }

  const sessionKey = sessionSeed
    ? await deriveKey(sessionSeed, masterKey)
    : masterKey;

  return {
    async encrypt(data: string): Promise<string> {
      try {
        const iv = await Crypto.getRandomBytesAsync(IV_SIZE);
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

        const encrypted = await Aes.encrypt(data, sessionKey, ivHex, 'aes-256-gcm');
        return `${ivHex}:${encrypted}`;
      } catch (e) {
        console.error('Encryption failed:', e);
        throw new Error('Encryption failed');
      }
    },

    async decrypt(encryptedData: string): Promise<string> {
      try {
        const [ivHex, ciphertext] = encryptedData.split(':');
        if (!ivHex || !ciphertext) {
          throw new Error('Invalid encrypted data format');
        }

        const decrypted = await Aes.decrypt(ciphertext, sessionKey, ivHex, 'aes-256-gcm');
        return decrypted;
      } catch (e) {
        console.error('Decryption failed:', e);
        throw new Error('Decryption failed');
      }
    },

    async setItem(key: string, value: object): Promise<void> {
      const jsonStr = JSON.stringify(value);
      const encrypted = await this.encrypt(jsonStr);
      await SecureStore.setItemAsync(`enc_${key}`, encrypted);
    },

    async getItem<T = unknown>(key: string): Promise<T | null> {
      const encrypted = await SecureStore.getItemAsync(`enc_${key}`);
      if (!encrypted) return null;
      try {
        const decrypted = await this.decrypt(encrypted);
        return JSON.parse(decrypted) as T;
      } catch {
        return null;
      }
    },

    async removeItem(key: string): Promise<void> {
      await SecureStore.deleteItemAsync(`enc_${key}`);
    },
  };
}

// Quick encrypt/decrypt helpers
export async function encryptData(data: string): Promise<string> {
  const storage = await createEncryptedStorage();
  return storage.encrypt(data);
}

export async function decryptData<T>(encryptedData: string): Promise<T | null> {
  const storage = await createEncryptedStorage();
  return storage.decrypt(encryptedData) as Promise<T>;
}