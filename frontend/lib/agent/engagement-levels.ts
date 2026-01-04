/**
 * 3-Tier Engagement System for Project Eve
 * 
 * Level 1: Sounding Board - Minimal interruption, periodic check-ins
 * Level 2: Co-Worker - Handles routine tasks, reports completion
 * Level 3: Personal Assistant - Anticipates needs, proactive help
 */

import { supabase } from '@/lib/supabase';

export type EngagementLevel = 1 | 2 | 3;

export interface EngagementConfig {
  level: EngagementLevel;
  name: string;
  description: string;
  behaviors: {
    proactiveCheckIns: boolean;
    checkInFrequency: 'rare' | 'moderate' | 'frequent';
    autoExecuteTasks: boolean;
    taskComplexity: 'none' | 'low' | 'medium' | 'high';
    anticipateNeeds: boolean;
    offerHelp: 'only_when_asked' | 'when_struggling' | 'proactively';
    demonstrateTasks: boolean;
    askClarifyingQuestions: 'minimal' | 'moderate' | 'thorough';
  };
  systemPromptAdditions: string;
}

export const ENGAGEMENT_CONFIGS: Record<EngagementLevel, EngagementConfig> = {
  1: {
    level: 1,
    name: 'Sounding Board',
    description: 'Minimal interruption. Light help when asked. Periodic check-ins.',
    behaviors: {
      proactiveCheckIns: true,
      checkInFrequency: 'rare',
      autoExecuteTasks: false,
      taskComplexity: 'none',
      anticipateNeeds: false,
      offerHelp: 'only_when_asked',
      demonstrateTasks: false,
      askClarifyingQuestions: 'minimal',
    },
    systemPromptAdditions: `
## ENGAGEMENT MODE: SOUNDING BOARD (Level 1)
Your role is to be a supportive listener and light helper.

BEHAVIOR GUIDELINES:
- Be responsive but not intrusive
- Only offer help when explicitly asked
- Keep responses concise and focused
- Periodically (every 5-10 interactions) ask: "Is there anything I can help lighten your load?"
- Do NOT proactively suggest tasks or improvements unless asked
- Focus on listening, understanding, and providing requested information
- When the user shares something, acknowledge it warmly but briefly
`,
  },
  2: {
    level: 2,
    name: 'Co-Worker',
    description: 'Handles routine tasks. Reports completion. Asks clarifying questions.',
    behaviors: {
      proactiveCheckIns: true,
      checkInFrequency: 'moderate',
      autoExecuteTasks: true,
      taskComplexity: 'low',
      anticipateNeeds: false,
      offerHelp: 'when_struggling',
      demonstrateTasks: false,
      askClarifyingQuestions: 'moderate',
    },
    systemPromptAdditions: `
## ENGAGEMENT MODE: CO-WORKER (Level 2)
Your role is to be a reliable colleague who handles routine tasks.

BEHAVIOR GUIDELINES:
- Actively look for tasks you can help with
- When you identify a task the user could delegate, offer to handle it
- For any task you take on:
  1. Ask clarifying questions BEFORE starting if anything is unclear
  2. Complete the work efficiently
  3. Report back when done with a summary
  4. Ask if the quality meets their expectations
- Handle low-level tasks like: drafting emails, summarizing documents, creating lists, scheduling suggestions, research
- Keep the user informed of progress on longer tasks
- If you notice the user doing repetitive work, offer to take it over
- Example phrases: "I can handle that for you", "Let me take care of this", "I'll draft that and send it over for your review"
`,
  },
  3: {
    level: 3,
    name: 'Personal Assistant',
    description: 'Anticipates needs. Proactively offers help. Can demonstrate or complete tasks.',
    behaviors: {
      proactiveCheckIns: true,
      checkInFrequency: 'frequent',
      autoExecuteTasks: true,
      taskComplexity: 'high',
      anticipateNeeds: true,
      offerHelp: 'proactively',
      demonstrateTasks: true,
      askClarifyingQuestions: 'thorough',
    },
    systemPromptAdditions: `
## ENGAGEMENT MODE: PERSONAL ASSISTANT (Level 3)
Your role is to be an always-ready assistant who anticipates needs and proactively helps.

BEHAVIOR GUIDELINES:
- Actively monitor for signs the user needs help:
  * Confusion (questions, uncertainty, "I don't know")
  * Struggle (repeated attempts, frustration, complexity beyond their stated expertise)
  * Overwhelm (multiple tasks, time pressure, stress indicators)
- When you detect these signs, proactively offer help: "I noticed you might be working through [X]. Would you like me to help?"
- For complex tasks, offer two options:
  1. "I can show you how to do this step-by-step"
  2. "Or I can just handle it for you if you'd rather not deal with it"
- Anticipate upcoming needs based on context:
  * If they mention a meeting, offer to prepare materials
  * If they're working on a project, suggest next steps
  * If they seem stressed, offer to prioritize their tasks
- Take initiative on tasks that clearly need doing
- Provide thorough explanations when demonstrating
- Always confirm before taking significant actions
- Example phrases: "I noticed you might need help with...", "Based on what you're working on, you might also need...", "Would you like me to show you how, or should I just take care of it?"
`,
  },
};

export class EngagementManager {
  private userId: string;
  private tenantId: string;
  private currentLevel: EngagementLevel = 2; // Default to Co-Worker

  constructor(userId: string, tenantId: string) {
    this.userId = userId;
    this.tenantId = tenantId;
  }

  async initialize(): Promise<void> {
    const { data } = await supabase
      .from('user_settings')
      .select('engagement_level')
      .eq('user_id', this.userId)
      .single();

    if (data?.engagement_level) {
      this.currentLevel = data.engagement_level as EngagementLevel;
    }
  }

  async setLevel(level: EngagementLevel): Promise<void> {
    this.currentLevel = level;
    
    await supabase.from('user_settings').upsert({
      user_id: this.userId,
      tenant_id: this.tenantId,
      engagement_level: level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  getLevel(): EngagementLevel {
    return this.currentLevel;
  }

  getConfig(): EngagementConfig {
    return ENGAGEMENT_CONFIGS[this.currentLevel];
  }

  getSystemPromptAdditions(): string {
    return ENGAGEMENT_CONFIGS[this.currentLevel].systemPromptAdditions;
  }

  /**
   * Analyze user message for signs of struggle or confusion
   */
  analyzeUserState(message: string, conversationHistory: string[]): {
    isConfused: boolean;
    isStruggling: boolean;
    isOverwhelmed: boolean;
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Confusion indicators
    const confusionPatterns = [
      /i don'?t (know|understand|get)/i,
      /what (do|does|is|are|should)/i,
      /how (do|does|can|should)/i,
      /i'?m (confused|lost|unsure)/i,
      /\?{2,}/,
      /help/i,
    ];
    
    // Struggle indicators
    const strugglePatterns = [
      /i (can'?t|couldn'?t|won'?t)/i,
      /this (is|isn'?t) working/i,
      /i'?ve tried/i,
      /still (not|doesn'?t|won'?t)/i,
      /frustrated/i,
      /stuck/i,
    ];
    
    // Overwhelm indicators
    const overwhelmPatterns = [
      /too (much|many)/i,
      /overwhelm/i,
      /so much to do/i,
      /don'?t have time/i,
      /stressed/i,
      /deadline/i,
    ];

    const isConfused = confusionPatterns.some(p => p.test(message));
    const isStruggling = strugglePatterns.some(p => p.test(message));
    const isOverwhelmed = overwhelmPatterns.some(p => p.test(message));

    // Calculate confidence based on how many indicators match
    const indicators = [isConfused, isStruggling, isOverwhelmed].filter(Boolean).length;
    const confidence = indicators > 0 ? Math.min(indicators * 0.4 + 0.3, 1) : 0;

    return { isConfused, isStruggling, isOverwhelmed, confidence };
  }

  /**
   * Determine if Eve should proactively offer help based on engagement level
   */
  shouldOfferHelp(userState: ReturnType<typeof this.analyzeUserState>): boolean {
    const config = this.getConfig();
    
    if (config.behaviors.offerHelp === 'only_when_asked') {
      return false;
    }
    
    if (config.behaviors.offerHelp === 'when_struggling') {
      return userState.isStruggling || userState.isConfused;
    }
    
    if (config.behaviors.offerHelp === 'proactively') {
      return userState.confidence > 0.3 || userState.isConfused || userState.isStruggling || userState.isOverwhelmed;
    }
    
    return false;
  }

  /**
   * Generate proactive help offer based on user state
   */
  generateHelpOffer(userState: ReturnType<typeof this.analyzeUserState>): string | null {
    if (!this.shouldOfferHelp(userState)) return null;

    const config = this.getConfig();

    if (userState.isConfused) {
      if (config.behaviors.demonstrateTasks) {
        return "I noticed you might be uncertain about this. Would you like me to walk you through it step-by-step, or would you prefer I just handle it for you?";
      }
      return "I can help clarify that if you'd like.";
    }

    if (userState.isStruggling) {
      if (config.behaviors.demonstrateTasks) {
        return "It looks like you're working through something challenging. I can either show you how to approach this, or take care of it entirely - whichever you prefer.";
      }
      return "Would you like some help with that?";
    }

    if (userState.isOverwhelmed) {
      return "You seem to have a lot on your plate. Would you like me to help prioritize your tasks or take some of them off your hands?";
    }

    return null;
  }
}
