import { NextResponse } from 'next/server';
import { createGoalManager } from '@/lib/agent/goal-manager';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const userId = searchParams.get('user_id');

  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'tenant_id and user_id required' }, { status: 400 });
  }

  const manager = createGoalManager(userId, tenantId);
  const goals = await manager.getActiveGoals();
  const stats = await manager.getGoalStats();
  const suggestions = await manager.suggestNextActions();

  return NextResponse.json({ goals, stats, suggestions });
}

export async function POST(req: Request) {
  try {
    const { title, description, priority, category, user_id, tenant_id } = await req.json();

    if (!title || !user_id) {
      return NextResponse.json({ error: 'title and user_id required' }, { status: 400 });
    }

    const manager = createGoalManager(user_id, tenant_id || user_id);
    const goal = await manager.createGoal({ title, description, priority, category });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[Goals API] Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { goal_id, subtask_id, status, notes, user_id, tenant_id } = await req.json();

    if (!goal_id || !subtask_id || !status || !user_id) {
      return NextResponse.json(
        { error: 'goal_id, subtask_id, status, and user_id are required' },
        { status: 400 }
      );
    }

    const manager = createGoalManager(user_id, tenant_id || user_id);
    const goal = await manager.updateSubtask(goal_id, subtask_id, status, notes);

    if (!goal) {
      return NextResponse.json({ error: 'Failed to update goal or subtask' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[Goals API] Error:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}
