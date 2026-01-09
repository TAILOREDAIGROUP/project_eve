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
    // Return demo data if no database
    return NextResponse.json({
      totalExecutions: 0,
      positiveRate: 0,
      topTasks: [],
      topDepartments: [],
      patternsLearned: 0,
      glossaryTerms: 0,
    });
  }

  try {
    // Get task executions
    const { data: executions } = await db
      .from('task_executions')
      .select('*')
      .eq('tenant_id', userId);

    const totalExecutions = executions?.length || 0;
    const positiveCount = executions?.filter(e => e.feedback === 'positive').length || 0;
    const feedbackCount = executions?.filter(e => e.feedback !== null).length || 0;
    const positiveRate = feedbackCount > 0 ? Math.round((positiveCount / feedbackCount) * 100) : 0;

    // Get top tasks
    const taskCounts: Record<string, number> = {};
    executions?.forEach(e => {
      taskCounts[e.task_title] = (taskCounts[e.task_title] || 0) + 1;
    });
    const topTasks = Object.entries(taskCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));

    // Get top departments
    const deptCounts: Record<string, number> = {};
    executions?.forEach(e => {
      deptCounts[e.department_id] = (deptCounts[e.department_id] || 0) + 1;
    });
    const topDepartments = Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Get patterns count
    const { count: patternsCount } = await db
      .from('business_patterns')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', userId);

    // Get glossary count
    const { count: glossaryCount } = await db
      .from('business_glossary')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', userId);

    return NextResponse.json({
      totalExecutions,
      positiveRate,
      topTasks,
      topDepartments,
      patternsLearned: patternsCount || 0,
      glossaryTerms: glossaryCount || 0,
    });
  } catch (error) {
    return NextResponse.json({
      totalExecutions: 0,
      positiveRate: 0,
      topTasks: [],
      topDepartments: [],
      patternsLearned: 0,
      glossaryTerms: 0,
    });
  }
}
