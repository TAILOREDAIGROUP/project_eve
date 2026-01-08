
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://srncvofpzagbntqrhdbu.supabase.co";
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
    "placeholder";

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

// Use getSupabase() instead of this constant to ensure lazy initialization
export const supabase = typeof window !== 'undefined' ? getSupabase() : null as unknown as SupabaseClient;
