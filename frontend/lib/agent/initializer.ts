import { MemoryService, AgentState, Memory } from '@/lib/memory/memory-service';
import { ProactivityService } from './proactivity';
import { ReviewService } from './review';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BootContext {
    agentState: AgentState;
    relevantMemories: Memory[];
    systemPrompt: string;
    isFirstInteraction: boolean;
    sessionId: string;
}

export interface BootCheckResult {
    passed: boolean;
    issues: string[];
    warnings: string[];
}

// ============================================================================
// AGENT INITIALIZER CLASS
// ============================================================================

export class AgentInitializer {
    private memoryService: MemoryService;
    private proactivityService: ProactivityService;
    private reviewService: ReviewService;
    private userId: string;
    private tenantId: string;

    constructor(userId: string, tenantId: string = 'default-tenant') {
        this.memoryService = new MemoryService(userId, tenantId);
        this.proactivityService = new ProactivityService(userId, tenantId);
        this.reviewService = new ReviewService(userId, tenantId);
        this.userId = userId;
        this.tenantId = tenantId;
    }

    /**
     * BOOT-UP RITUAL: Standardized agent initialization sequence
     * 
     * Steps:
     * 1. Read Memory - Get agent state and relevant memories
     * 2. Run Checks - Verify system health and user context
     * 3. Orient - Build dynamic system prompt with context
     * 4. Proactivity - Add proactive nudges
     * 5. Act - Return boot context for agent to use
     */
    async bootUp(userMessage: string): Promise<BootContext> {
        // STEP 1: READ MEMORY
        const [agentState, relevantMemories] = await Promise.all([
            this.memoryService.getAgentState(),
            this.memoryService.retrieveMemories(userMessage, 10),
        ]);

        // STEP 2: RUN CHECKS
        const checkResult = await this.runBootChecks(agentState);

        if (!checkResult.passed) {
            console.warn('Boot checks failed:', checkResult.issues);
        }

        // STEP 3: ORIENT - Build system prompt
        const interactionCount = agentState.metadata?.interaction_count || 0;
        const isFirstInteraction = interactionCount === 0;
        let systemPrompt = this.buildSystemPrompt(
            agentState,
            relevantMemories,
            isFirstInteraction,
            checkResult
        );

        // STEP 4: PROACTIVITY - Add proactive nudges
        try {
            const proactiveSection = await this.proactivityService.generateProactivePromptSection();
            systemPrompt += proactiveSection;
        } catch (error) {
            console.warn('Proactivity check failed:', error);
            // Continue without proactive nudges
        }

        // STEP 5: ACT - Create session
        const sessionId = await this.memoryService.createSession('Chat with Eve');
        
        // Update interaction count in agent state
        const newInteractionCount = interactionCount + 1;
        await this.memoryService.updateAgentState({
            metadata: {
                ...agentState.metadata,
                interaction_count: newInteractionCount
            }
        });

        return {
            agentState,
            relevantMemories,
            systemPrompt,
            isFirstInteraction,
            sessionId,
        };
    }

    /**
     * Run boot-up checks to verify system health
     */
    private async runBootChecks(state: AgentState): Promise<BootCheckResult> {
        const issues: string[] = [];
        const warnings: string[] = [];
        const interactionCount = state.metadata?.interaction_count || 0;

        // Check 1: Verify user has goals if they're a returning user
        if (interactionCount > 5 && state.current_goals.length === 0) {
            warnings.push('User has no active goals despite multiple interactions');
        }

        // Check 2: Check for stale goals (not discussed in 7+ days)
        if (state.last_interaction_at) {
            const daysSinceLastInteraction = Math.floor(
                (Date.now() - new Date(state.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceLastInteraction > 7 && state.current_goals.length > 0) {
                warnings.push(`Goals may be stale (${daysSinceLastInteraction} days since last interaction)`);
            }
        }

        // Check 3: Verify blocked tasks
        const blockedTasks = state.active_tasks.filter(t => t.status === 'blocked');
        if (blockedTasks.length > 0) {
            warnings.push(`${blockedTasks.length} blocked task(s) detected`);
        }

        return {
            passed: issues.length === 0,
            issues,
            warnings,
        };
    }

    /**
     * Build dynamic system prompt based on context
     */
    private buildSystemPrompt(
        state: AgentState,
        memories: Memory[],
        isFirst: boolean,
        checkResult: BootCheckResult
    ): string {
        const currentDate = new Date().toISOString().split('T')[0];
        const interactionNum = (state.metadata?.interaction_count || 0) + 1;

        // Base prompt
        const basePrompt = `You are Eve, a proactive AI assistant for Project Eve. You remember previous conversations and actively help users achieve their goals.

## System Information
- Current Date: ${currentDate}
- Interaction #${interactionNum}
- User ID: ${this.userId}
`;

        // First-time vs returning user
        const greetingSection = isFirst
            ? `\n## FIRST INTERACTION
This is your FIRST interaction with this user. 
- Introduce yourself warmly as Eve
- Learn about their goals and what they want to accomplish
- Be curious and ask clarifying questions
- Start building a mental model of who they are
`
            : `\n## RETURNING USER
You have interacted with this user ${state.metadata?.interaction_count || 0} times before.
- Reference past context naturally (don't just list facts)
- Show continuity and memory of previous conversations
- Track progress toward stated goals
- Be proactive in offering help based on what you know
`;

        // Goals section
        const goalsSection = state.current_goals.length > 0
            ? `\n## User's Current Goals
${state.current_goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}
`
            : '';

        // Tasks section
        const tasksSection = state.active_tasks.length > 0
            ? `\n## Active Tasks
${state.active_tasks.map(t => `- [${t.status.toUpperCase()}] ${t.description}`).join('\n')}
`
            : '';

        // Memories section
        const memoriesSection = memories.length > 0
            ? `\n## Relevant Context from Previous Conversations
${memories.map(m => `- [${m.memory_type.toUpperCase()}] ${m.content} (confidence: ${(m.confidence * 100).toFixed(0)}%)`).join('\n')}
`
            : '';

        // User profile section
        const userProfile = state.metadata?.user_profile || {};
        const profileSection = Object.keys(userProfile).length > 0
            ? `\n## User Profile
${JSON.stringify(userProfile, null, 2)}
`
            : '';

        // Warnings section (proactive triggers)
        const warningsSection = checkResult.warnings.length > 0
            ? `\n## ⚠️ Proactive Alerts
${checkResult.warnings.map(w => `- ${w}`).join('\n')}

**Action Required**: Address these alerts proactively in your response if relevant.
`
            : '';

        // Behavior guidelines
        const behaviorSection = `\n## Your Behavior Guidelines

### Core Principles
1. **Be Proactive** - Don't just respond, anticipate needs
   - If you notice the user is stuck, offer suggestions
   - If a goal seems stale, ask about progress
   - If a task is blocked, help unblock it

2. **Remember Everything** - Use your memory system
   - Reference past conversations naturally
   - Track progress toward goals
   - Learn preferences and adapt

3. **Be Helpful** - Focus on outcomes
   - Ask clarifying questions when needed
   - Break down complex goals into tasks
   - Celebrate wins and progress

4. **Stay Organized** - Maintain structure
   - Keep goals and tasks up to date
   - Summarize conversations
   - Set clear next steps

### After Each Interaction
- Identify any new facts, preferences, or goals to remember
- Update task statuses if discussed
- Note any blockers or issues
- Set expectations for next interaction

### Proactivity Triggers
- **Stale Goal**: If a goal hasn't been discussed in 7+ days, ask about it
- **Blocked Task**: If a task is blocked, offer to help unblock it
- **Streak**: If user has been consistent, acknowledge and encourage
- **Pattern**: If you notice a pattern (e.g., always asks about X on Mondays), anticipate it
- **Milestone**: If user is close to completing a goal, celebrate and push them over the line
`;

        // Combine all sections
        return `${basePrompt}${greetingSection}${goalsSection}${tasksSection}${memoriesSection}${profileSection}${warningsSection}${behaviorSection}`;
    }

    /**
     * Post-interaction cleanup, memory extraction, and quality review
     */
    async postInteraction(
        sessionId: string,
        userMessage: string,
        assistantResponse: string
    ): Promise<void> {
        try {
            // STEP 1: Save messages
            await Promise.all([
                this.memoryService.saveMessage(sessionId, 'user', userMessage),
                this.memoryService.saveMessage(sessionId, 'assistant', assistantResponse),
            ]);

            // STEP 2: Quality Review
            const reviewResult = await this.reviewService.quickCheck(assistantResponse, userMessage);
            await this.reviewService.logReview(sessionId, assistantResponse, reviewResult);

            // STEP 3: Memory Extraction
            await this.memoryService.extractMemoriesFromMessage(
                userMessage,
                assistantResponse
            );

            // STEP 4: Update agent state with last interaction timestamp
            await this.memoryService.updateAgentState({
                last_interaction_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in post-interaction:', error);
        }
    }

    /**
     * Shutdown ritual - end session and summarize
     */
    async shutdown(sessionId: string, summary?: string): Promise<void> {
        try {
            await this.memoryService.endSession(sessionId, summary);
        } catch (error) {
            console.error('Error in shutdown:', error);
        }
    }
}
