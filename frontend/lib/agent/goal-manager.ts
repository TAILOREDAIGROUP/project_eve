/**
 * Goal Management System for Project Eve
 * Tracks user goals, decomposes them into tasks, and manages execution
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';

export interface Subtask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  estimatedTime?: string;
  completedAt?: string;
  notes?: string;
}

export interface Goal {
  id: string;
  userId: string;
  tenantId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  subtasks: Subtask[];
  progress: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GoalDetectionResult {
  isGoal: boolean;
  goalData?: Partial<Goal>;
  confidence: number;
}

export class GoalManager {
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
   * Detect if a user message implies a new goal
   */
  async detectGoal(message: string): Promise<GoalDetectionResult> {
    const prompt = `Analyze this user message to see if they are expressing a long-term goal or a complex task that should be tracked.

USER MESSAGE: "${message}"

If it is a goal, extract a title, brief description, and estimated priority.
A goal is something that takes multiple steps or happens over time (e.g., "I want to learn Python", "Plan my wedding", "Build a startup").
A simple command or question is NOT a goal (e.g., "What time is it?", "Tell me a joke", "Send an email").

Respond ONLY with valid JSON:
{
  "isGoal": <boolean>,
  "confidence": <0-100>,
  "goalData": {
    "title": "<short descriptive title>",
    "description": "<brief description>",
    "priority": "<low|medium|high|critical>",
    "category": "<learning|project|personal|health|work|other>"
  }
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.2,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { isGoal: false, confidence: 0 };

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isGoal: parsed.isGoal && parsed.confidence > 70,
        confidence: parsed.confidence,
        goalData: parsed.goalData,
      };
    } catch (error) {
      console.error('[GoalManager] Goal detection failed:', error);
      return { isGoal: false, confidence: 0 };
    }
  }

  /**
   * Create a new goal and decompose it into subtasks
   */
  async createGoal(data: Partial<Goal>): Promise<Goal | null> {
    const title = data.title || 'Untitled Goal';
    const description = data.description || '';
    
    // Decompose into subtasks using AI
    const subtasks = await this.decomposeGoal(title, description);

    const goalData = {
      user_id: this.userId,
      tenant_id: this.tenantId,
      title,
      description,
      status: 'active',
      priority: data.priority || 'medium',
      category: data.category || 'other',
      subtasks,
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: createdGoal, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;
      return this.mapDbGoalToGoal(createdGoal);
    } catch (error) {
      console.error('[GoalManager] Failed to create goal:', error);
      return null;
    }
  }

  /**
   * Use AI to break a goal into actionable subtasks
   */
  private async decomposeGoal(title: string, description: string): Promise<Subtask[]> {
    const prompt = `Break down this goal into 3-7 actionable subtasks.

GOAL: ${title}
DESCRIPTION: ${description}

Each subtask should be clear and specific.
Respond ONLY with valid JSON:
{
  "subtasks": [
    {"description": "<task description>", "estimatedTime": "<e.g. 2 hours, 1 week>"}
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
      return (parsed.subtasks || []).map((st: any, index: number) => ({
        id: `st_${Date.now()}_${index}`,
        description: st.description,
        status: 'pending',
        estimatedTime: st.estimatedTime,
      }));
    } catch (error) {
      console.error('[GoalManager] Goal decomposition failed:', error);
      return [];
    }
  }

  /**
   * Get all active goals for the tenant
   */
  async getActiveGoals(): Promise<Goal[]> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('status', 'active')
        .order('priority', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapDbGoalToGoal);
    } catch (error) {
      console.error('[GoalManager] Failed to fetch goals:', error);
      return [];
    }
  }

  /**
   * Update subtask status and recalculate progress
   */
  async updateSubtask(goalId: string, subtaskId: string, status: Subtask['status'], notes?: string): Promise<Goal | null> {
    try {
      const { data: goalData, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (fetchError || !goalData) throw fetchError || new Error('Goal not found');

      const goal = this.mapDbGoalToGoal(goalData);
      const subtasks = [...goal.subtasks];
      const index = subtasks.findIndex(st => st.id === subtaskId);

      if (index === -1) throw new Error('Subtask not found');

      subtasks[index] = {
        ...subtasks[index],
        status,
        notes: notes || subtasks[index].notes,
        completedAt: status === 'completed' ? new Date().toISOString() : subtasks[index].completedAt,
      };

      // Recalculate progress
      const completedCount = subtasks.filter(st => st.status === 'completed').length;
      const progress = Math.round((completedCount / subtasks.length) * 100);
      
      const isFullyCompleted = progress === 100;

      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update({
          subtasks,
          progress,
          status: isFullyCompleted ? 'completed' : goal.status,
          completed_at: isFullyCompleted ? new Date().toISOString() : goal.completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;
      return this.mapDbGoalToGoal(updatedGoal);
    } catch (error) {
      console.error('[GoalManager] Failed to update subtask:', error);
      return null;
    }
  }

  /**
   * Suggest next actions based on active goals
   */
  async suggestNextActions(): Promise<string[]> {
    const goals = await this.getActiveGoals();
    if (goals.length === 0) return [];

    const activeSubtasks = goals
      .flatMap(g => g.subtasks.filter(st => st.status === 'pending' || st.status === 'in_progress').map(st => ({ ...st, goalTitle: g.title })))
      .slice(0, 5);

    if (activeSubtasks.length === 0) return [];

    const prompt = `Based on these active goal subtasks, suggest 3 concise, motivating next actions for the user.

SUBTASKS:
${activeSubtasks.map(st => `- [${st.goalTitle}] ${st.description}`).join('\n')}

Respond ONLY with valid JSON:
{
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.7,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.suggestions || [];
    } catch (error) {
      return [];
    }
  }

  private mapDbGoalToGoal(dbGoal: any): Goal {
    return {
      id: dbGoal.id,
      userId: dbGoal.user_id,
      tenantId: dbGoal.tenant_id,
      title: dbGoal.title,
      description: dbGoal.description,
      status: dbGoal.status,
      priority: dbGoal.priority,
      category: dbGoal.category,
      subtasks: dbGoal.subtasks || [],
      progress: dbGoal.progress || 0,
      targetDate: dbGoal.target_date,
      createdAt: dbGoal.created_at,
      updatedAt: dbGoal.updated_at,
      completedAt: dbGoal.completed_at,
    };
  }

  async getGoalStats(): Promise<{ total: number; active: number; completed: number; averageProgress: number }> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('status, progress')
        .eq('tenant_id', this.tenantId);

      if (error || !data) throw error || new Error('No data');

      const active = data.filter(g => g.status === 'active').length;
      const completed = data.filter(g => g.status === 'completed').length;
      const totalProgress = data.reduce((sum, g) => sum + (g.progress || 0), 0);

      return {
        total: data.length,
        active,
        completed,
        averageProgress: data.length > 0 ? Math.round(totalProgress / data.length) : 0,
      };
    } catch (error) {
      return { total: 0, active: 0, completed: 0, averageProgress: 0 };
    }
  }
}

/**
 * Factory function
 */
export const createGoalManager = (userId: string, tenantId: string): GoalManager => {
  return new GoalManager(userId, tenantId);
};
