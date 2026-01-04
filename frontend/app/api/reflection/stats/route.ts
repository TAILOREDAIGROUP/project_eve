import { NextResponse } from 'next/server';
import { createSelfReflection } from '@/lib/agent/self-reflection';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id') || 'default-tenant';
  const userId = searchParams.get('user_id') || 'default-user';
  const days = parseInt(searchParams.get('days') || '30');

  const reflection = createSelfReflection(userId, tenantId);

  try {
    const [averageScores, improvementTrends] = await Promise.all([
      reflection.getAverageScores(days),
      reflection.getImprovementTrends(10),
    ]);

    return NextResponse.json({
      success: true,
      period: `${days} days`,
      averageScores,
      improvementTrends,
      totalReflections: averageScores.count,
    });
  } catch (error) {
    console.error('[ReflectionStats] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reflection stats' },
      { status: 500 }
    );
  }
}
