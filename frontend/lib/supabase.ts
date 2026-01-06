
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

// For backward compatibility while we migrate
export const supabase = getSupabase();
