import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const db = getSupabase();
  
  // Check if we have valid config
  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

  if (!isConfigured) {
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
