import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  if (!url || !key) {
    console.log('[AgenticStats] Supabase not configured, using demo data');
    return null;
  }
  
  supabase = createClient(url, key);
  return supabase;
}

export async function GET(req: Request) {
  const db = getSupabase();
  
  if (!db) {
    return NextResponse.json({
      engagementLevel: { level: 2, name: 'Co-Worker' },
      reflectionStats: { averageScore: 87, totalReflections: 156 },
      learningStats: { feedbackCount: 89, successRate: 94 },
      goalStats: { active: 3, completed: 12, averageProgress: 67 },
      knowledgeStats: { entities: 47, relationships: 83 },
    });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id') || 'default-tenant';
  const userId = searchParams.get('user_id') || 'default-user';

  try {
    const { data: settings } = await db
      .from('user_settings')
      .select('engagement_level')
      .eq('user_id', userId)
      .single();

    const engagementLevel = settings?.engagement_level || 2;
    const engagementNames: Record<number, string> = {
      1: 'Sounding Board',
      2: 'Co-Worker',
      3: 'Personal Assistant',
    };

    const { data: reflections } = await db
      .from('reflections')
      .select('scores')
      .eq('tenant_id', tenantId);

    const totalReflections = reflections?.length || 0;
    const averageScore = totalReflections > 0
      ? Math.round(reflections!.reduce((sum, r) => sum + (r.scores?.overall || 0), 0) / totalReflections)
      : 0;

    const { data: feedback } = await db
      .from('feedback')
      .select('feedback')
      .eq('tenant_id', tenantId);

    const feedbackCount = feedback?.length || 0;
    const positiveCount = feedback?.filter(f => f.feedback === 'positive').length || 0;
    const successRate = feedbackCount > 0 ? Math.round((positiveCount / feedbackCount) * 100) : 0;

    const { data: goals } = await db
      .from('goals')
      .select('status, progress')
      .eq('tenant_id', tenantId);

    const activeGoals = goals?.filter(g => g.status === 'active').length || 0;
    const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;
    const averageProgress = goals && goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
      : 0;

    const { count: entityCount } = await db
      .from('knowledge_entities')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const { count: relationshipCount } = await db
      .from('knowledge_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    return NextResponse.json({
      engagementLevel: { level: engagementLevel, name: engagementNames[engagementLevel] || 'Co-Worker' },
      reflectionStats: { averageScore, totalReflections },
      learningStats: { feedbackCount, successRate },
      goalStats: { active: activeGoals, completed: completedGoals, averageProgress },
      knowledgeStats: { entities: entityCount || 0, relationships: relationshipCount || 0 },
    });
  } catch (error) {
    console.error('[AgenticStats] Error:', error);
    return NextResponse.json({
      engagementLevel: { level: 2, name: 'Co-Worker' },
      reflectionStats: { averageScore: 0, totalReflections: 0 },
      learningStats: { feedbackCount: 0, successRate: 0 },
      goalStats: { active: 0, completed: 0, averageProgress: 0 },
      knowledgeStats: { entities: 0, relationships: 0 },
    });
  }
}
