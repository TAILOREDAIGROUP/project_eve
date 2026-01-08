import { supabase } from '@/lib/supabase';

interface Interaction {
  id: string;
  userId: string;
  query: string;
  response: string;
  feedback?: 'positive' | 'negative' | null;
  reflectionScore?: number;
  timestamp: Date;
}

interface LearningInsight {
  pattern: string;
  frequency: number;
  successRate: number;
  recommendation: string;
}

export class ContinuousLearner {
  private userId: string;
  private tenantId: string;

  constructor(userId: string, tenantId: string) {
    this.userId = userId;
    this.tenantId = tenantId;
  }

  // Store interaction for learning
  async recordInteraction(interaction: Omit<Interaction, 'id' | 'timestamp'>) {
    await supabase.from('interactions').insert({
      ...interaction,
      tenant_id: this.tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  // Record user feedback
  async recordFeedback(interactionId: string, feedback: 'positive' | 'negative') {
    await supabase
      .from('interactions')
      .update({ feedback })
      .eq('id', interactionId);
    
    // Trigger learning update
    await this.updateLearnings();
  }

  // Analyze patterns and extract learnings
  async updateLearnings() {
    // Get recent interactions with feedback
    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .not('feedback', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!interactions || interactions.length < 10) return;

    // Analyze what works and what doesn't
    const positivePatterns = interactions
      .filter(i => i.feedback === 'positive')
      .map(i => i.query);
    
    const negativePatterns = interactions
      .filter(i => i.feedback === 'negative')
      .map(i => i.query);

    // Store learnings for future use
    await supabase.from('learnings').upsert({
      tenant_id: this.tenantId,
      positive_patterns: positivePatterns,
      negative_patterns: negativePatterns,
      updated_at: new Date().toISOString(),
    });
  }

  // Get learnings to enhance future responses
  async getLearnings(): Promise<LearningInsight[]> {
    const { data } = await supabase
      .from('learnings')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .single();

    if (!data) return [];

    return [
      {
        pattern: 'User preferences',
        frequency: data.positive_patterns?.length || 0,
        successRate: this.calculateSuccessRate(data),
        recommendation: 'Apply learned preferences to responses',
      },
    ];
  }

  private calculateSuccessRate(data: any): number {
    const positive = data.positive_patterns?.length || 0;
    const negative = data.negative_patterns?.length || 0;
    const total = positive + negative;
    return total > 0 ? (positive / total) * 100 : 50;
  }
}
