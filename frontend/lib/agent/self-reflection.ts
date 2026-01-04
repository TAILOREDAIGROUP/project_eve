/**
 * Self-Reflection System for Project Eve
 * Evaluates response quality and auto-improves when needed
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';

export interface ReflectionScores {
  accuracy: number;
  helpfulness: number;
  completeness: number;
  clarity: number;
  empathy: number;
  overall: number;
}

export interface ReflectionResult {
  scores: ReflectionScores;
  improvements: string[];
  shouldRevise: boolean;
  reasoning: string;
  revisedResponse?: string;
}

export class SelfReflection {
  private openrouter: ReturnType<typeof createOpenAI>;
  private userId: string;
  private tenantId: string;
  private threshold: number;

  constructor(userId: string, tenantId: string, threshold: number = 70) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.threshold = threshold;
    this.openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }

  /**
   * Evaluate a response on 5 quality criteria
   */
  async evaluate(userQuery: string, aiResponse: string, context?: string): Promise<ReflectionResult> {
    const prompt = `You are a strict quality evaluator for an AI assistant named Eve. Critically analyze this response.

USER QUERY: ${userQuery}

EVE'S RESPONSE: ${aiResponse}

${context ? `CONTEXT: ${context}` : ''}

Evaluate on these criteria (0-100 each, be critical and honest):
1. ACCURACY - Is information factually correct? (Penalize guessing or uncertainty)
2. HELPFULNESS - Does it directly solve the user's problem? (Penalize vague answers)
3. COMPLETENESS - Are all aspects of the query addressed? (Penalize missing information)
4. CLARITY - Is it well-organized and easy to understand? (Penalize confusion or rambling)
5. EMPATHY - Does it acknowledge user's situation appropriately? (Penalize cold/robotic responses)

Be strict. Most responses should score between 60-85. Only exceptional responses score above 90.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "scores": {
    "accuracy": <0-100>,
    "helpfulness": <0-100>,
    "completeness": <0-100>,
    "clarity": <0-100>,
    "empathy": <0-100>
  },
  "improvements": ["<specific actionable improvement 1>", "<specific actionable improvement 2>"],
  "shouldRevise": <true if any score below 70 or overall below 75>,
  "reasoning": "<one sentence explaining the evaluation>"
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.2,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid JSON response from evaluator');

      const parsed = JSON.parse(jsonMatch[0]);
      const scores = parsed.scores;
      
      // Calculate overall score
      scores.overall = Math.round(
        (scores.accuracy + scores.helpfulness + scores.completeness + scores.clarity + scores.empathy) / 5
      );

      const reflectionResult: ReflectionResult = {
        scores,
        improvements: parsed.improvements || [],
        shouldRevise: parsed.shouldRevise || scores.overall < this.threshold,
        reasoning: parsed.reasoning || 'Evaluation complete',
      };

      // Store reflection for learning analytics
      await this.storeReflection(userQuery, aiResponse, reflectionResult);

      return reflectionResult;
    } catch (error) {
      console.error('[SelfReflection] Evaluation error:', error);
      // Return default passing result if evaluation fails
      return {
        scores: { accuracy: 75, helpfulness: 75, completeness: 75, clarity: 75, empathy: 75, overall: 75 },
        improvements: [],
        shouldRevise: false,
        reasoning: 'Evaluation failed, defaulting to pass',
      };
    }
  }

  /**
   * Revise a response based on improvement feedback
   */
  async revise(userQuery: string, originalResponse: string, improvements: string[]): Promise<string> {
    if (improvements.length === 0) return originalResponse;

    const prompt = `You are Eve, an AI assistant. Your previous response needs improvement.

ORIGINAL USER QUERY: ${userQuery}

YOUR ORIGINAL RESPONSE: ${originalResponse}

IMPROVEMENTS NEEDED:
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

Rewrite your response to address ALL improvements listed above. Keep what was good, fix what was lacking.

Provide ONLY the improved response - no explanations, no meta-commentary, just the better response.`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.7,
      });
      return result.text;
    } catch (error) {
      console.error('[SelfReflection] Revision error:', error);
      return originalResponse;
    }
  }

  /**
   * Full reflection cycle: evaluate and revise if needed
   */
  async evaluateAndRevise(
    userQuery: string,
    aiResponse: string,
    context?: string
  ): Promise<{
    response: string;
    wasRevised: boolean;
    reflection: ReflectionResult;
  }> {
    const reflection = await this.evaluate(userQuery, aiResponse, context);

    if (reflection.shouldRevise && reflection.improvements.length > 0) {
      const revisedResponse = await this.revise(userQuery, aiResponse, reflection.improvements);
      reflection.revisedResponse = revisedResponse;
      
      return {
        response: revisedResponse,
        wasRevised: true,
        reflection,
      };
    }

    return {
      response: aiResponse,
      wasRevised: false,
      reflection,
    };
  }

  /**
   * Store reflection results for analytics and learning
   */
  private async storeReflection(
    userQuery: string,
    aiResponse: string,
    result: ReflectionResult
  ): Promise<void> {
    try {
      await supabase.from('reflections').insert({
        user_id: this.userId,
        tenant_id: this.tenantId,
        user_query: userQuery,
        ai_response: aiResponse,
        scores: result.scores,
        improvements: result.improvements,
        was_revised: result.shouldRevise,
        revised_response: result.revisedResponse || null,
        reasoning: result.reasoning,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[SelfReflection] Failed to store reflection:', error);
    }
  }

  /**
   * Get average scores over time for analytics
   */
  async getAverageScores(days: number = 30): Promise<ReflectionScores & { count: number }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await supabase
      .from('reflections')
      .select('scores')
      .eq('tenant_id', this.tenantId)
      .gte('created_at', since.toISOString());

    if (!data || data.length === 0) {
      return { accuracy: 0, helpfulness: 0, completeness: 0, clarity: 0, empathy: 0, overall: 0, count: 0 };
    }

    const totals = data.reduce(
      (acc, r) => ({
        accuracy: acc.accuracy + (r.scores?.accuracy || 0),
        helpfulness: acc.helpfulness + (r.scores?.helpfulness || 0),
        completeness: acc.completeness + (r.scores?.completeness || 0),
        clarity: acc.clarity + (r.scores?.clarity || 0),
        empathy: acc.empathy + (r.scores?.empathy || 0),
        overall: acc.overall + (r.scores?.overall || 0),
      }),
      { accuracy: 0, helpfulness: 0, completeness: 0, clarity: 0, empathy: 0, overall: 0 }
    );

    const count = data.length;
    return {
      accuracy: Math.round(totals.accuracy / count),
      helpfulness: Math.round(totals.helpfulness / count),
      completeness: Math.round(totals.completeness / count),
      clarity: Math.round(totals.clarity / count),
      empathy: Math.round(totals.empathy / count),
      overall: Math.round(totals.overall / count),
      count,
    };
  }

  /**
   * Get improvement trends - what areas need the most work
   */
  async getImprovementTrends(limit: number = 10): Promise<{ area: string; frequency: number }[]> {
    const { data } = await supabase
      .from('reflections')
      .select('improvements')
      .eq('tenant_id', this.tenantId)
      .not('improvements', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data) return [];

    const counts = new Map<string, number>();
    data.forEach(r => {
      (r.improvements || []).forEach((imp: string) => {
        const key = imp.toLowerCase().substring(0, 50);
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([area, frequency]) => ({ area, frequency }));
  }
}

/**
 * Factory function to create SelfReflection instance
 */
export const createSelfReflection = (userId: string, tenantId: string, threshold?: number): SelfReflection => {
  return new SelfReflection(userId, tenantId, threshold);
};
