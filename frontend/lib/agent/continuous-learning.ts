/**
 * Continuous Learning System for Project Eve
 * Learns from user feedback and extracts patterns to improve over time
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';

export interface LearningPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  lastSeen: string;
}

export interface UserPreference {
  category: 'tone' | 'format' | 'detail' | 'style' | 'other';
  preference: string;
  confidence: number;
  examples: string[];
}

export interface FeedbackEntry {
  interactionId: string;
  feedback: 'positive' | 'negative';
  comment?: string;
  timestamp: string;
}

export class ContinuousLearner {
  private openrouter: ReturnType<typeof createOpenAI>;
  private userId: string;
  private tenantId: string;

  constructor(userId: string, tenantId: string) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }

  /**
   * Record user feedback on an interaction
   */
  async recordFeedback(
    interactionId: string,
    feedback: 'positive' | 'negative',
    comment?: string
  ): Promise<void> {
    try {
      await supabase.from('feedback').insert({
        interaction_id: interactionId,
        user_id: this.userId,
        tenant_id: this.tenantId,
        feedback,
        comment,
        created_at: new Date().toISOString(),
      });

      console.log(`[ContinuousLearner] Recorded ${feedback} feedback for interaction ${interactionId}`);

      // Check if we should trigger a learning update
      const { count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.tenantId);

      // Update learnings every 10 feedback entries
      if (count && count % 10 === 0) {
        await this.updateLearnings();
      }
    } catch (error) {
      console.error('[ContinuousLearner] Failed to record feedback:', error);
    }
  }

  /**
   * Analyze feedback and extract learning patterns
   */
  async updateLearnings(): Promise<void> {
    console.log('[ContinuousLearner] Updating learnings from feedback...');

    try {
      // Get recent feedback with associated interactions
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('feedback, comment, created_at')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!feedbackData || feedbackData.length < 5) {
        console.log('[ContinuousLearner] Not enough feedback to extract patterns');
        return;
      }

      // Extract patterns and preferences
      const patterns = await this.extractPatterns(feedbackData);
      const preferences = await this.extractPreferences(feedbackData);

      // Store learnings
      await supabase.from('learnings').upsert({
        tenant_id: this.tenantId,
        user_id: this.userId,
        patterns,
        preferences,
        feedback_count: feedbackData.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id' });

      console.log(`[ContinuousLearner] Updated learnings: ${patterns.length} patterns, ${preferences.length} preferences`);
    } catch (error) {
      console.error('[ContinuousLearner] Failed to update learnings:', error);
    }
  }

  /**
   * Extract communication patterns from feedback
   */
  private async extractPatterns(feedbackData: any[]): Promise<LearningPattern[]> {
    const positive = feedbackData.filter(f => f.feedback === 'positive').length;
    const negative = feedbackData.filter(f => f.feedback === 'negative').length;
    const total = positive + negative;

    if (total < 5) return [];

    const comments = feedbackData
      .filter(f => f.comment)
      .map(f => `[${f.feedback}] ${f.comment}`)
      .slice(0, 15);

    if (comments.length < 3) {
      // Return basic pattern based on ratio
      return [{
        pattern: positive > negative ? 'Generally positive responses' : 'Needs improvement in responses',
        frequency: total,
        successRate: Math.round((positive / total) * 100),
        lastSeen: new Date().toISOString(),
      }];
    }

    const prompt = `Analyze this user feedback and extract communication patterns that work or don't work.

FEEDBACK DATA:
- Total feedback: ${total}
- Positive: ${positive} (${Math.round((positive / total) * 100)}%)
- Negative: ${negative} (${Math.round((negative / total) * 100)}%)

COMMENTS:
${comments.join('\n')}

Extract 2-5 actionable patterns. Respond ONLY with valid JSON:
{
  "patterns": [
    {"pattern": "<what works or doesn't work>", "frequency": <1-10>, "successRate": <0-100>}
  ]
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.3,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.patterns || []).map((p: any) => ({
        ...p,
        lastSeen: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[ContinuousLearner] Pattern extraction failed:', error);
      return [];
    }
  }

  /**
   * Extract user preferences from positive feedback
   */
  private async extractPreferences(feedbackData: any[]): Promise<UserPreference[]> {
    const positiveComments = feedbackData
      .filter(f => f.feedback === 'positive' && f.comment)
      .map(f => f.comment);

    if (positiveComments.length < 3) return [];

    const prompt = `Analyze these positive feedback comments and extract user preferences for AI communication.

POSITIVE FEEDBACK COMMENTS:
${positiveComments.slice(0, 10).map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Extract 2-4 preferences. Respond ONLY with valid JSON:
{
  "preferences": [
    {"category": "<tone|format|detail|style>", "preference": "<specific preference>", "confidence": <0-100>}
  ]
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.3,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.preferences || []).map((p: any) => ({
        ...p,
        examples: positiveComments.slice(0, 3),
      }));
    } catch (error) {
      console.error('[ContinuousLearner] Preference extraction failed:', error);
      return [];
    }
  }

  /**
   * Get current learnings for this user/tenant
   */
  async getLearnings(): Promise<{ patterns: LearningPattern[]; preferences: UserPreference[] }> {
    try {
      const { data } = await supabase
        .from('learnings')
        .select('patterns, preferences')
        .eq('tenant_id', this.tenantId)
        .single();

      return {
        patterns: data?.patterns || [],
        preferences: data?.preferences || [],
      };
    } catch (error) {
      return { patterns: [], preferences: [] };
    }
  }

  /**
   * Generate personalization context for system prompt
   */
  async getPersonalizationContext(): Promise<string> {
    const learnings = await this.getLearnings();

    if (learnings.patterns.length === 0 && learnings.preferences.length === 0) {
      return '';
    }

    let context = '\n## LEARNED USER PREFERENCES\n';
    context += 'Based on past interactions and feedback, this user prefers:\n';

    if (learnings.preferences.length > 0) {
      learnings.preferences.forEach(p => {
        context += `- ${p.category.toUpperCase()}: ${p.preference} (confidence: ${p.confidence}%)\n`;
      });
    }

    if (learnings.patterns.length > 0) {
      context += '\nSuccessful communication patterns:\n';
      learnings.patterns
        .filter(p => p.successRate > 60)
        .slice(0, 3)
        .forEach(p => {
          context += `- ${p.pattern} (success rate: ${p.successRate}%)\n`;
        });
    }

    context += '\nApply these learnings to personalize your responses.\n';

    return context;
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    total: number;
    positive: number;
    negative: number;
    successRate: number;
  }> {
    const { data } = await supabase
      .from('feedback')
      .select('feedback')
      .eq('tenant_id', this.tenantId);

    if (!data || data.length === 0) {
      return { total: 0, positive: 0, negative: 0, successRate: 0 };
    }

    const positive = data.filter(f => f.feedback === 'positive').length;
    const negative = data.filter(f => f.feedback === 'negative').length;
    const total = data.length;

    return {
      total,
      positive,
      negative,
      successRate: total > 0 ? Math.round((positive / total) * 100) : 0,
    };
  }
}

/**
 * Factory function
 */
export const createContinuousLearner = (userId: string, tenantId: string): ContinuousLearner => {
  return new ContinuousLearner(userId, tenantId);
};
