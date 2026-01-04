/**
 * Proactive Engine for Project Eve
 * Generates insights, reminders, and anticipatory suggestions
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';
import { createGoalManager } from './goal-manager';
import { EngagementLevel, ENGAGEMENT_CONFIGS } from './engagement-levels';

export interface ProactiveInsight {
  id: string;
  type: 'reminder' | 'suggestion' | 'check_in' | 'tip' | 'alert' | 'goal_update';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  relatedGoalId?: string;
  actionable: boolean;
  suggestedAction?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserActivity {
  lastInteraction: Date | null;
  interactionCount: number;
  averageSessionLength: number;
  topTopics: string[];
  recentQueries: string[];
}

export class ProactiveEngine {
  private openrouter: ReturnType<typeof createOpenAI>;
  private userId: string;
  private tenantId: string;
  private goalManager: ReturnType<typeof createGoalManager>;
  private engagementLevel: EngagementLevel;

  constructor(userId: string, tenantId: string, engagementLevel: EngagementLevel = 2) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.engagementLevel = engagementLevel;
    this.goalManager = createGoalManager(userId, tenantId);
    this.openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }

  setEngagementLevel(level: EngagementLevel): void {
    this.engagementLevel = level;
  }

  /**
   * Generate all relevant insights based on user activity and goals
   */
  async generateInsights(): Promise<ProactiveInsight[]> {
    const config = ENGAGEMENT_CONFIGS[this.engagementLevel];
    const insights: ProactiveInsight[] = [];

    // Only generate proactive insights if engagement level allows
    if (!config.behaviors.proactiveCheckIns && !config.behaviors.anticipateNeeds) {
      return insights;
    }

    try {
      // Check goal progress
      const goalInsights = await this.checkGoalProgress();
      insights.push(...goalInsights);

      // Check for engagement opportunities
      const engagementInsights = await this.checkEngagement();
      insights.push(...engagementInsights);

      // Generate contextual tips (only for level 2+)
      if (this.engagementLevel >= 2) {
        const tips = await this.generateContextualTips();
        insights.push(...tips);
      }

      // Anticipate needs (only for level 3)
      if (this.engagementLevel === 3 && config.behaviors.anticipateNeeds) {
        const anticipatedNeeds = await this.anticipateNeeds();
        insights.push(...anticipatedNeeds);
      }

      // Store insights for retrieval
      await this.storeInsights(insights);

      return insights;
    } catch (error) {
      console.error('[ProactiveEngine] Error generating insights:', error);
      return [];
    }
  }

  /**
   * Check goal progress and generate reminders
   */
  private async checkGoalProgress(): Promise<ProactiveInsight[]> {
    const goals = await this.goalManager.getActiveGoals();
    const insights: ProactiveInsight[] = [];

    for (const goal of goals) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(goal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Stalled goal reminder
      if (daysSinceUpdate > 3 && goal.progress < 100) {
        insights.push({
          id: `goal-stalled-${goal.id}`,
          type: 'reminder',
          title: `Goal needs attention: ${goal.title}`,
          content: `You haven't made progress on "${goal.title}" in ${daysSinceUpdate} days. Would you like to review your next steps?`,
          priority: goal.priority === 'high' || goal.priority === 'critical' ? 'high' : 'medium',
          relatedGoalId: goal.id,
          actionable: true,
          suggestedAction: 'Review goal subtasks',
          createdAt: new Date().toISOString(),
        });
      }

      // Progress milestone celebration
      if (goal.progress >= 50 && goal.progress < 100) {
        const pendingTasks = goal.subtasks.filter(st => st.status === 'pending');
        if (pendingTasks.length > 0) {
          insights.push({
            id: `goal-progress-${goal.id}`,
            type: 'goal_update',
            title: `Great progress on "${goal.title}"!`,
            content: `You're ${goal.progress}% done! Next up: ${pendingTasks[0].description}`,
            priority: 'low',
            relatedGoalId: goal.id,
            actionable: true,
            suggestedAction: pendingTasks[0].description,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Approaching deadline
      if (goal.targetDate) {
        const daysUntilDeadline = Math.floor(
          (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && goal.progress < 80) {
          insights.push({
            id: `goal-deadline-${goal.id}`,
            type: 'alert',
            title: `Deadline approaching: ${goal.title}`,
            content: `Only ${daysUntilDeadline} days left and you're at ${goal.progress}%. Let's prioritize this!`,
            priority: 'high',
            relatedGoalId: goal.id,
            actionable: true,
            suggestedAction: 'Focus on completing remaining tasks',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return insights;
  }

  /**
   * Check user engagement and generate check-ins
   */
  private async checkEngagement(): Promise<ProactiveInsight[]> {
    const config = ENGAGEMENT_CONFIGS[this.engagementLevel];
    const insights: ProactiveInsight[] = [];

    try {
      const { data: lastInteraction } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastInteraction) return insights;

      const daysSinceLastChat = Math.floor(
        (Date.now() - new Date(lastInteraction.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine check-in threshold based on engagement level
      let checkInThreshold: number;
      switch (config.behaviors.checkInFrequency) {
        case 'rare': checkInThreshold = 7; break;
        case 'moderate': checkInThreshold = 3; break;
        case 'frequent': checkInThreshold = 1; break;
        default: checkInThreshold = 7;
      }

      if (daysSinceLastChat >= checkInThreshold) {
        insights.push({
          id: `check-in-${Date.now()}`,
          type: 'check_in',
          title: daysSinceLastChat > 7 ? "It's been a while!" : "Checking in",
          content: this.getCheckInMessage(daysSinceLastChat),
          priority: 'low',
          actionable: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[ProactiveEngine] Engagement check failed:', error);
    }

    return insights;
  }

  /**
   * Generate contextual tips based on recent activity
   */
  private async generateContextualTips(): Promise<ProactiveInsight[]> {
    try {
      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('content')
        .eq('tenant_id', this.tenantId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentConversations || recentConversations.length < 3) return [];

      const topics = recentConversations.map(c => c.content.substring(0, 100)).join('\n');

      const prompt = `Based on these recent user queries, suggest ONE helpful tip or resource that would be valuable:

RECENT TOPICS:
${topics}

Respond ONLY with valid JSON:
{
  "tip": {
    "title": "<short title - max 50 chars>",
    "content": "<helpful tip or suggestion - max 200 chars>",
    "actionable": true/false,
    "suggestedAction": "<specific action if actionable>"
  }
}`;

      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.7,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.tip) return [];

      return [{
        id: `tip-${Date.now()}`,
        type: 'tip',
        title: parsed.tip.title,
        content: parsed.tip.content,
        priority: 'low',
        actionable: parsed.tip.actionable,
        suggestedAction: parsed.tip.suggestedAction,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24h
      }];
    } catch (error) {
      console.error('[ProactiveEngine] Tip generation failed:', error);
      return [];
    }
  }

  /**
   * Anticipate user needs based on patterns (Level 3 only)
   */
  private async anticipateNeeds(): Promise<ProactiveInsight[]> {
    try {
      // Get user's typical patterns
      const { data: patterns } = await supabase
        .from('conversations')
        .select('content, created_at')
        .eq('tenant_id', this.tenantId)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!patterns || patterns.length < 10) return [];

      const prompt = `Analyze these user queries and anticipate what they might need help with next:

RECENT QUERIES:
${patterns.slice(0, 20).map(p => `- ${p.content.substring(0, 100)}`).join('\n')}

Based on patterns, predict ONE thing the user might need soon. Respond ONLY with valid JSON:
{
  "anticipation": {
    "title": "<what you anticipate - max 50 chars>",
    "content": "<why you think this and how you can help - max 200 chars>",
    "confidence": <0-100>
  }
}`;

      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.5,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.anticipation || parsed.anticipation.confidence < 60) return [];

      return [{
        id: `anticipate-${Date.now()}`,
        type: 'suggestion',
        title: parsed.anticipation.title,
        content: parsed.anticipation.content,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Would you like help with this?',
        createdAt: new Date().toISOString(),
      }];
    } catch (error) {
      console.error('[ProactiveEngine] Need anticipation failed:', error);
      return [];
    }
  }

  /**
   * Get appropriate check-in message based on time away
   */
  private getCheckInMessage(daysSinceLastChat: number): string {
    if (daysSinceLastChat > 14) {
      return "I hope everything is going well! Is there anything I can help you with today?";
    } else if (daysSinceLastChat > 7) {
      return "It's been a little while since we chatted. How are your projects coming along?";
    } else if (daysSinceLastChat > 3) {
      return "Just checking in - is there anything I can help lighten your load?";
    } else {
      return "How's everything going? Any tasks I can take off your plate?";
    }
  }

  /**
   * Store insights for later retrieval
   */
  private async storeInsights(insights: ProactiveInsight[]): Promise<void> {
    if (insights.length === 0) return;

    try {
      await supabase.from('proactive_insights').insert(
        insights.map(insight => ({
          ...insight,
          user_id: this.userId,
          tenant_id: this.tenantId,
        }))
      );
    } catch (error) {
      console.error('[ProactiveEngine] Failed to store insights:', error);
    }
  }

  /**
   * Get pending insights for the user
   */
  async getPendingInsights(limit: number = 5): Promise<ProactiveInsight[]> {
    try {
      const { data } = await supabase
        .from('proactive_insights')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('[ProactiveEngine] Failed to get insights:', error);
      return [];
    }
  }

  /**
   * Generate proactive context for system prompt
   */
  async getProactiveContext(): Promise<string> {
    const config = ENGAGEMENT_CONFIGS[this.engagementLevel];
    
    if (!config.behaviors.proactiveCheckIns && !config.behaviors.anticipateNeeds) {
      return '';
    }

    const insights = await this.getPendingInsights(3);
    if (insights.length === 0) return '';

    let context = '\n## PROACTIVE INSIGHTS\n';
    context += 'Consider mentioning these insights if relevant to the conversation:\n';

    insights.forEach((insight, i) => {
      context += `${i + 1}. [${insight.type.toUpperCase()}] ${insight.title}: ${insight.content}\n`;
    });

    return context;
  }
}

/**
 * Factory function
 */
export const createProactiveEngine = (
  userId: string,
  tenantId: string,
  engagementLevel?: EngagementLevel
): ProactiveEngine => {
  return new ProactiveEngine(userId, tenantId, engagementLevel);
};
