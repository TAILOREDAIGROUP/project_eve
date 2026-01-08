/**
 * Agentic Orchestrator for Project Eve
 * Main orchestration layer that coordinates all agentic capabilities
 */

import { supabase } from '@/lib/supabase';
import { EngagementManager, EngagementLevel, ENGAGEMENT_CONFIGS } from './engagement-levels';
import { SelfReflection, createSelfReflection } from './self-reflection';
import { ContinuousLearner, createContinuousLearner } from './continuous-learning';
import { GoalManager, createGoalManager } from './goal-manager';
import { ProactiveEngine, createProactiveEngine } from './proactive-engine';
import { KnowledgeGraph, createKnowledgeGraph } from './knowledge-graph';
import { MultiAgentSystem, createMultiAgentSystem } from './multi-agent';

export interface AgenticContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  engagementLevel: EngagementLevel;
  systemPrompt: string;
  memories: string;
  goals: string;
  knowledge: string;
  proactiveInsights: string;
  learnings: string;
  interactionCount: number;
}

export interface AgenticResponse {
  response: string;
  wasRevised: boolean;
  reflectionScore: number;
  detectedGoal: boolean;
  proactiveHelpOffered: boolean;
  metadata: {
    engagementLevel: EngagementLevel;
    engagementName: string;
    sessionId: string;
    interactionCount: number;
  };
}

export class AgenticOrchestrator {
  private userId: string;
  private tenantId: string;
  private sessionId: string;
  
  // Sub-systems
  private engagementManager: EngagementManager;
  private selfReflection: SelfReflection;
  private continuousLearner: ContinuousLearner;
  private goalManager: GoalManager;
  private proactiveEngine: ProactiveEngine;
  private knowledgeGraph: KnowledgeGraph;
  private multiAgent: MultiAgentSystem;

  constructor(userId: string, tenantId: string, sessionId?: string) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.sessionId = sessionId || `session-${userId}-${Date.now()}`;

    // Initialize all sub-systems
    this.engagementManager = new EngagementManager(userId, tenantId);
    this.selfReflection = createSelfReflection(userId, tenantId);
    this.continuousLearner = createContinuousLearner(userId, tenantId);
    this.goalManager = createGoalManager(userId, tenantId);
    this.proactiveEngine = createProactiveEngine(userId, tenantId);
    this.knowledgeGraph = createKnowledgeGraph(userId, tenantId);
    this.multiAgent = createMultiAgentSystem(userId, tenantId);
  }

  /**
   * Initialize the orchestrator (load user settings, etc.)
   */
  async initialize(): Promise<void> {
    await this.engagementManager.initialize();
    this.proactiveEngine.setEngagementLevel(this.engagementManager.getLevel());
  }

  /**
   * Build the complete agentic context for a conversation
   */
  async buildContext(userQuery: string): Promise<AgenticContext> {
    const engagementLevel = this.engagementManager.getLevel();
    const config = ENGAGEMENT_CONFIGS[engagementLevel];

    // Gather context from all sub-systems in parallel
    const [
      goalContext,
      knowledgeContext,
      proactiveContext,
      learningContext,
      interactionCount,
    ] = await Promise.all([
      this.goalManager.getGoalContext(),
      this.knowledgeGraph.getKnowledgeContext(userQuery),
      this.proactiveEngine.getProactiveContext(),
      this.continuousLearner.getPersonalizationContext(),
      this.getInteractionCount(),
    ]);

    // Retrieve memories
    const memories = await this.getMemoryContext();

    // Build the complete system prompt
    const systemPrompt = this.buildSystemPrompt(
      config,
      memories,
      goalContext,
      knowledgeContext,
      proactiveContext,
      learningContext
    );

    return {
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      engagementLevel,
      systemPrompt,
      memories,
      goals: goalContext,
      knowledge: knowledgeContext,
      proactiveInsights: proactiveContext,
      learnings: learningContext,
      interactionCount,
    };
  }

  /**
   * Process a user message through the agentic pipeline
   */
  async processMessage(
    userQuery: string,
    aiResponse: string,
    context: AgenticContext
  ): Promise<AgenticResponse> {
    const config = ENGAGEMENT_CONFIGS[context.engagementLevel];
    let finalResponse = aiResponse;
    let wasRevised = false;
    let reflectionScore = 75;
    let detectedGoal = false;
    let proactiveHelpOffered = false;

    // 1. Self-Reflection (evaluate and potentially revise response)
    const reflectionResult = await this.selfReflection.evaluateAndRevise(
      userQuery,
      aiResponse,
      context.systemPrompt
    );
    finalResponse = reflectionResult.response;
    wasRevised = reflectionResult.wasRevised;
    reflectionScore = reflectionResult.reflection.scores.overall;

    // 2. Goal Detection
    const goalDetection = await this.goalManager.detectGoal(userQuery);
    if (goalDetection.isGoal && goalDetection.goalData) {
      detectedGoal = true;
      // Create the goal in the background
      this.goalManager.createGoal(goalDetection.goalData).catch(console.error);
    }

    // 3. Proactive Help (based on engagement level)
    const userState = this.engagementManager.analyzeUserState(userQuery, []);
    if (this.engagementManager.shouldOfferHelp(userState)) {
      const helpOffer = this.engagementManager.generateHelpOffer(userState);
      if (helpOffer && !finalResponse.includes(helpOffer)) {
        finalResponse += `\n\n${helpOffer}`;
        proactiveHelpOffered = true;
      }
    }

    // 4. Check-in (based on engagement level and interaction count)
    if (this.engagementManager.shouldCheckIn(context.interactionCount)) {
      const checkIn = this.engagementManager.getCheckInMessage();
      if (!finalResponse.includes(checkIn)) {
        finalResponse += `\n\n${checkIn}`;
      }
    }

    // 5. Update Knowledge Graph (async, don't block response)
    this.knowledgeGraph.processConversation(userQuery, finalResponse).catch(console.error);

    // 6. Increment interaction count
    await this.incrementInteractionCount();

    return {
      response: finalResponse,
      wasRevised,
      reflectionScore,
      detectedGoal,
      proactiveHelpOffered,
      metadata: {
        engagementLevel: context.engagementLevel,
        engagementName: config.name,
        sessionId: this.sessionId,
        interactionCount: context.interactionCount + 1,
      },
    };
  }

  /**
   * Build the complete system prompt with all context
   */
  private buildSystemPrompt(
    config: typeof ENGAGEMENT_CONFIGS[1],
    memories: string,
    goals: string,
    knowledge: string,
    proactive: string,
    learnings: string
  ): string {
    return `You are Eve, an intelligent AI assistant created by Tailored AI Group.

## CORE IDENTITY
- You have persistent memory and remember information users share with you
- You adapt your communication style to match the user
- You help users achieve their goals proactively
- You learn from interactions and improve over time

${config.systemPromptAdditions}

${memories}

${goals}

${knowledge}

${proactive}

${learnings}

## CURRENT INTERACTION
Respond helpfully to the user's message. Apply your learned preferences and remembered information to personalize your response.

Current Date: ${new Date().toISOString()}
`;
  }

  /**
   * Get memory context from database
   */
  private async getMemoryContext(): Promise<string> {
    try {
      const { data: memories } = await supabase
        .from('memories')
        .select('content, memory_type, importance')
        .eq('user_id', this.userId)
        .order('importance', { ascending: false })
        .limit(15);

      if (!memories || memories.length === 0) return '';

      let context = '\n## REMEMBERED INFORMATION ABOUT THIS USER\n';
      context += 'You have learned the following from previous conversations:\n';
      memories.forEach((mem, i) => {
        context += `${i + 1}. [${mem.memory_type}] ${mem.content}\n`;
      });
      context += '\nUse this information to personalize your responses.\n';

      return context;
    } catch (error) {
      console.error('[Orchestrator] Failed to get memories:', error);
      return '';
    }
  }

  /**
   * Get interaction count for this session
   */
  private async getInteractionCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', this.sessionId);

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Increment interaction count
   */
  private async incrementInteractionCount(): Promise<void> {
    try {
      await supabase.from('user_settings').upsert({
        user_id: this.userId,
        tenant_id: this.tenantId,
        last_interaction: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('[Orchestrator] Failed to update interaction:', error);
    }
  }

  /**
   * Set engagement level
   */
  async setEngagementLevel(level: EngagementLevel): Promise<void> {
    await this.engagementManager.setLevel(level);
    this.proactiveEngine.setEngagementLevel(level);
  }

  /**
   * Get current engagement level
   */
  getEngagementLevel(): EngagementLevel {
    return this.engagementManager.getLevel();
  }

  /**
   * Record user feedback
   */
  async recordFeedback(interactionId: string, feedback: 'positive' | 'negative', comment?: string): Promise<void> {
    await this.continuousLearner.recordFeedback(interactionId, feedback, comment);
  }

  /**
   * Get agentic capabilities status
   */
  async getCapabilitiesStatus(): Promise<{
    engagementLevel: { level: EngagementLevel; name: string };
    reflectionStats: { averageScore: number; totalReflections: number };
    learningStats: { feedbackCount: number; successRate: number };
    goalStats: { active: number; completed: number; averageProgress: number };
    knowledgeStats: { entities: number; relationships: number };
  }> {
    const [reflectionStats, feedbackStats, goalStats, knowledgeStats] = await Promise.all([
      this.selfReflection.getAverageScores(30),
      this.continuousLearner.getFeedbackStats(),
      this.goalManager.getGoalStats(),
      this.knowledgeGraph.getStats(),
    ]);

    const config = ENGAGEMENT_CONFIGS[this.engagementManager.getLevel()];

    return {
      engagementLevel: {
        level: this.engagementManager.getLevel(),
        name: config.name,
      },
      reflectionStats: {
        averageScore: reflectionStats.overall,
        totalReflections: reflectionStats.count,
      },
      learningStats: {
        feedbackCount: feedbackStats.total,
        successRate: feedbackStats.successRate,
      },
      goalStats: {
        active: goalStats.active,
        completed: goalStats.completed,
        averageProgress: goalStats.averageProgress,
      },
      knowledgeStats: {
        entities: knowledgeStats.totalEntities,
        relationships: knowledgeStats.totalRelationships,
      },
    };
  }

  /**
   * Execute a complex task using multi-agent system
   */
  async executeComplexTask(objective: string, context: string): Promise<string> {
    const plan = await this.multiAgent.createPlan(objective, context);
    const result = await this.multiAgent.executePlan(plan);
    return result.finalOutput;
  }
}

/**
 * Factory function
 */
export const createAgenticOrchestrator = (
  userId: string,
  tenantId: string,
  sessionId?: string
): AgenticOrchestrator => {
  return new AgenticOrchestrator(userId, tenantId, sessionId);
};
