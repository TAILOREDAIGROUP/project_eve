import { NextResponse, NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('engagement_level')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ engagement_level: 2 }); // Default to Co-Worker
    }

    return NextResponse.json({ engagement_level: data.engagement_level });
  } catch (error) {
    return NextResponse.json({ engagement_level: 2 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  try {
    const { engagement_level } = await req.json();

    if (engagement_level === undefined) {
      return NextResponse.json(
        { error: 'engagement_level required' },
        { status: 400 }
      );
    }

    if (![1, 2, 3].includes(engagement_level)) {
      return NextResponse.json(
        { error: 'engagement_level must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      tenant_id: userId,
      engagement_level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, engagement_level });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update engagement level' }, { status: 500 });
  }
}
