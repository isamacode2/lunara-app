import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://evctyqajzoviaiawnvky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Y3R5cWFqem92aWFpYXdudmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzQ1NTUsImV4cCI6MjA4NzgxMDU1NX0.xxbS_uAO9UVuq6tSzTL2F7OKICjFvmoPQH1ZLcHgbrY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const PUSH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`;
export { SUPABASE_ANON_KEY };
