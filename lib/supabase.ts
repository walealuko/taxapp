import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables');
}

const supabaseConfig = {
  auth: {
    persistSession: false, // Essential for server-side rendering
  },
};

// In Node.js environments (like during static export), we need to provide the 'ws' transport for Supabase Realtime
if (typeof window === 'undefined') {
  try {
    // We use eval to hide the require call from Metro's static analysis,
    // preventing it from trying to bundle 'ws' and its Node dependencies (like 'stream') for the web.
    const ws = eval('require("ws")');
    (supabaseConfig as any).realtime = {
      transport: ws,
    };
  } catch (e) {
    console.warn('Failed to load ws transport for Supabase Realtime:', e);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
