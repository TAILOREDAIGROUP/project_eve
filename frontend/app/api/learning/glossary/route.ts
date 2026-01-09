import { NextResponse, NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ terms: [] });
  }

  try {
    const { data, error } = await db
      .from('business_glossary')
      .select('*')
      .eq('tenant_id', userId)
      .order('term');

    if (error) {
      return NextResponse.json({ terms: [] });
    }

    return NextResponse.json({ terms: data || [] });
  } catch (error) {
    return NextResponse.json({ terms: [] });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { term, definition, category } = await req.json();

  if (!term || !definition) {
    return NextResponse.json({ error: 'term and definition required' }, { status: 400 });
  }

  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { data, error } = await db
      .from('business_glossary')
      .insert({
        tenant_id: userId,
        term,
        definition,
        category: category || 'general',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ term: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add term' }, { status: 500 });
  }
}
