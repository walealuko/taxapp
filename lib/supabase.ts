import { createClient } from '@supabase/supabase-js';

// Expo requires EXPO_PUBLIC_ prefix for variables to be bundled into the client-side JS.
// We support both EXPO_PUBLIC_ and NEXT_PUBLIC_ for maximum compatibility.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Essential for server-side rendering
      },
    });
  } catch (e) {
    console.error('Supabase initialization error:', e);
  }
}

// Dummy client to prevent the app from crashing if environment variables are missing.
// This allows the app to load and potentially show a helpful configuration error UI.
const dummyClient = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  },
} as any;

export const supabase = supabaseClient || dummyClient;
