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

export async function POST(req: Request) {
  const { tenant_id, user_id, provider_id } = await req.json();

  if (!tenant_id || !provider_id) {
    return NextResponse.json({ error: 'tenant_id and provider_id required' }, { status: 400 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // In production, this would initiate OAuth flow and store real tokens
    // For now, simulate a successful connection
    const { data, error } = await db
      .from('integrations')
      .upsert({
        tenant_id,
        user_id: user_id || tenant_id,
        provider_id,
        status: 'connected',
        account_info: { email: 'demo@example.com', name: 'Demo User' },
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,provider_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
