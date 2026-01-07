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
    return NextResponse.json({ actions: [] });
  }

  try {
    const { data, error } = await db
      .from('action_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ actions: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenant_id, user_id, action_type, provider_id, task_id, input_data } = body;

  if (!tenant_id || !user_id || !action_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await db
      .from('action_logs')
      .insert({
        tenant_id,
        user_id,
        action_type,
        provider_id,
        task_id,
        input_data: input_data || {},
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ action: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create action log' }, { status: 500 });
  }
}
