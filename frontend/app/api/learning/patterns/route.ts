import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ patterns: [] });
  }

  try {
    const { data, error } = await db
      .from('business_patterns')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('usage_count', { ascending: false });

    if (error) {
      return NextResponse.json({ patterns: [] });
    }

    return NextResponse.json({ patterns: data || [] });
  } catch (error) {
    return NextResponse.json({ patterns: [] });
  }
}
