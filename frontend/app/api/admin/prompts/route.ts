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
    // Return empty if no database
    return NextResponse.json({ departments: [] });
  }

  try {
    const { data, error } = await db
      .from('department_prompts')
      .select('departments')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ departments: [] });
    }

    return NextResponse.json({ departments: data.departments || [] });
  } catch (error) {
    return NextResponse.json({ departments: [] });
  }
}

export async function POST(req: Request) {
  const { tenant_id, departments } = await req.json();

  if (!tenant_id || !departments) {
    return NextResponse.json({ error: 'tenant_id and departments required' }, { status: 400 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { error } = await db
      .from('department_prompts')
      .upsert({
        tenant_id,
        departments,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save departments' }, { status: 500 });
  }
}
