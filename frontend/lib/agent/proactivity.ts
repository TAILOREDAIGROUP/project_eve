import { MemoryService, AgentState, Memory } from '@/lib/memory/memory-service';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProactiveTrigger {
    id: string;
    tenant_id: string;
    user_id: string;
    trigger_type: 'stale_goal' | 'blocked_task' | 'streak' | 'pattern' | 'milestone';
    trigger_data: Record<string, any>;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'fired' | 'resolved' | 'ignored';
    fired_at: string | null;
    resolved_at: string | null;
    created_at: string;
}

export interface ProactivePrompt {
    type: ProactiveTrigger['trigger_type'];
    message: string;
    priority: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestedAction?: string;
}

// ============================================================================
// PROACTIVITY SERVICE
// ============================================================================

export class ProactivityService {
    private memoryService: MemoryService;
    private userId: string;
    private tenantId: string;

    constructor(userId: string, tenantId: string = 'default-tenant') {
        this.memoryService = new MemoryService(userId, tenantId);
        this.userId = userId;
        this.tenantId = tenantId;
    }

    /**
     * Check for proactive triggers based on user state
     */
    async checkTriggers(): Promise<ProactivePrompt[]> {
        const prompts: ProactivePrompt[] = [];

        try {
            const agentState = await this.memoryService.getAgentState();

            // Check for stale goals
            const staleGoalPrompts = this.checkStaleGoals(agentState);
            prompts.push(...staleGoalPrompts);

            // Check for blocked tasks
            const blockedTaskPrompts = this.checkBlockedTasks(agentState);
            prompts.push(...blockedTaskPrompts);

            // Check for streaks
            const streakPrompts = await this.checkStreaks(agentState);
            prompts.push(...streakPrompts);

            // Check for milestones
            const milestonePrompts = this.checkMilestones(agentState);
            prompts.push(...milestonePrompts);

        } catch (error) {
            console.error('Error checking triggers:', error);
        }

        return prompts;
    }

    /**
     * Check for stale goals (not discussed in 7+ days)
     */
    private checkStaleGoals(state: AgentState): ProactivePrompt[] {
        const prompts: ProactivePrompt[] = [];

        if (!state.last_interaction_at) return prompts;

        const daysSinceLastInteraction = Math.floor(
            (Date.now() - new Date(state.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastInteraction >= 7 && state.current_goals.length > 0) {
            prompts.push({
                type: 'stale_goal',
                message: `It's been ${daysSinceLastInteraction} days since we last talked. How is progress on your goals?`,
                priority: 'medium',
                actionable: true,
                suggestedAction: 'Review and update goals',
            });
        }

        return prompts;
    }

    /**
     * Check for blocked tasks
     */
    private checkBlockedTasks(state: AgentState): ProactivePrompt[] {
        const prompts: ProactivePrompt[] = [];

        const blockedTasks = state.active_tasks.filter(t => t.status === 'blocked');

        if (blockedTasks.length > 0) {
            for (const task of blockedTasks.slice(0, 3)) { // Max 3 blocked task prompts
                prompts.push({
                    type: 'blocked_task',
                    message: `I noticed "${task.description}" is blocked. Would you like help unblocking it?`,
                    priority: 'high',
                    actionable: true,
                    suggestedAction: `Help unblock: ${task.description}`,
                });
            }
        }

        return prompts;
    }

    /**
     * Check for interaction streaks
     */
    private async checkStreaks(state: AgentState): Promise<ProactivePrompt[]> {
        const prompts: ProactivePrompt[] = [];

        // Check for milestone streaks (5, 10, 25, 50, 100 interactions)
        const milestoneStreaks = [5, 10, 25, 50, 100];
        const interactionCount = state.metadata?.interaction_count || 0;

        if (milestoneStreaks.includes(interactionCount)) {
            prompts.push({
                type: 'streak',
                message: `🎉 Milestone! This is our ${interactionCount}th conversation. You're making great progress!`,
                priority: 'low',
                actionable: false,
            });
        }

        return prompts;
    }

    /**
     * Check for goal milestones
     */
    private checkMilestones(state: AgentState): ProactivePrompt[] {
        const prompts: ProactivePrompt[] = [];

        // Check for completed tasks (potential milestone)
        const completedTasks = state.active_tasks.filter(t => t.status === 'completed');

        if (completedTasks.length > 0) {
            prompts.push({
                type: 'milestone',
                message: `Great job completing ${completedTasks.length} task(s)! Keep up the momentum!`,
                priority: 'low',
                actionable: false,
            });
        }

        return prompts;
    }

    /**
     * Generate a proactive system prompt addition based on triggers
     */
    async generateProactivePromptSection(): Promise<string> {
        const triggers = await this.checkTriggers();

        if (triggers.length === 0) {
            return '';
        }

        const highPriority = triggers.filter(t => t.priority === 'high');
        const mediumPriority = triggers.filter(t => t.priority === 'medium');
        const lowPriority = triggers.filter(t => t.priority === 'low');

        let section = '\n\n## 🔔 Proactive Nudges\n';
        section += 'Consider naturally mentioning these in your response if relevant:\n\n';

        if (highPriority.length > 0) {
            section += '### High Priority\n';
            for (const t of highPriority) {
                section += `- **[${t.type}]** ${t.message}\n`;
            }
        }

        if (mediumPriority.length > 0) {
            section += '### Medium Priority\n';
            for (const t of mediumPriority) {
                section += `- [${t.type}] ${t.message}\n`;
            }
        }

        if (lowPriority.length > 0) {
            section += '### Celebrations\n';
            for (const t of lowPriority) {
                section += `- ${t.message}\n`;
            }
        }

        return section;
    }

    /**
     * Create a trigger in the database (for tracking)
     */
    async createTrigger(
        type: ProactiveTrigger['trigger_type'],
        data: Record<string, any>,
        priority: ProactiveTrigger['priority'] = 'medium'
    ): Promise<void> {
        try {
            const { error } = await supabase.from('proactive_triggers').insert({
                user_id: this.userId,
                tenant_id: this.tenantId,
                trigger_type: type,
                trigger_data: data,
                priority,
                status: 'pending',
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error creating trigger:', error);
        }
    }

    /**
     * Resolve a trigger
     */
    async resolveTrigger(triggerId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('proactive_triggers')
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                })
                .eq('id', triggerId);
            if (error) throw error;
        } catch (error) {
            console.error('Error resolving trigger:', error);
        }
    }
}
