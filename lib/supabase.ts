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
  // We use a dynamic require to avoid bundling 'ws' into the client-side bundle
  const ws = require('ws');
  (supabaseConfig as any).realtime = {
    transport: ws,
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
