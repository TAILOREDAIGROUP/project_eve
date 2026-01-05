import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  supabase = createClient(url, key);
  return supabase;
}

export async function GET(req: Request) {
  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({
      memories: [
        { id: '1', content: 'User prefers concise responses', memory_type: 'preference', importance: 8, created_at: new Date().toISOString() },
        { id: '2', content: 'User is working on a marketing campaign', memory_type: 'context', importance: 9, created_at: new Date().toISOString() },
        { id: '3', content: 'User company is Tailored AI Group', memory_type: 'fact', importance: 10, created_at: new Date().toISOString() },
      ]
    });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    const { data, error } = await db
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memories: data || [] });
  } catch (error) {
    return NextResponse.json({ memories: [] });
  }
}
