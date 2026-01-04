import { NextResponse } from 'next/server';
import { createContinuousLearner } from '@/lib/agent/continuous-learning';

export async function POST(req: Request) {
  try {
    const { interaction_id, feedback, comment, user_id, tenant_id } = await req.json();

    if (!interaction_id || !feedback || !user_id) {
      return NextResponse.json(
        { error: 'interaction_id, feedback, and user_id are required' },
        { status: 400 }
      );
    }

    if (!['positive', 'negative'].includes(feedback)) {
      return NextResponse.json(
        { error: 'feedback must be "positive" or "negative"' },
        { status: 400 }
      );
    }

    const learner = createContinuousLearner(user_id, tenant_id || user_id);
    await learner.recordFeedback(interaction_id, feedback, comment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const userId = searchParams.get('user_id');

  if (!tenantId || !userId) {
    return NextResponse.json({ error: 'tenant_id and user_id required' }, { status: 400 });
  }

  const learner = createContinuousLearner(userId, tenantId);
  const stats = await learner.getFeedbackStats();
  const learnings = await learner.getLearnings();

  return NextResponse.json({ stats, learnings });
}
