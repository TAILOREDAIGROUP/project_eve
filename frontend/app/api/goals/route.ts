import { NextResponse, NextRequest } from 'next/server';
import { createGoalManager } from '@/lib/agent/goal-manager';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const manager = createGoalManager(userId, userId);
  const goals = await manager.getActiveGoals();
  const stats = await manager.getGoalStats();
  const suggestions = await manager.suggestNextActions();

  return NextResponse.json({ goals, stats, suggestions });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, priority, category } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const manager = createGoalManager(userId, userId);
    const goal = await manager.createGoal({ title, description, priority, category });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('[Goals API] Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id, subtask_id, status, notes } = await req.json();

    if (!goal_id || !subtask_id || !status) {
      return NextResponse.json(
        { error: 'goal_id, subtask_id, and status are required' },
        { status: 400 }
      );
    }

    const manager = createGoalManager(userId, userId);
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
