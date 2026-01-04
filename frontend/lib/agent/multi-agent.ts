/**
 * Multi-Agent Coordination System for Project Eve
 * Specialized sub-agents that work together to handle complex tasks
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export type AgentRole = 
  | 'researcher'      // Finds and synthesizes information
  | 'writer'          // Creates content and documents
  | 'analyst'         // Analyzes data and provides insights
  | 'planner'         // Creates plans and breaks down goals
  | 'critic'          // Reviews and improves outputs
  | 'coordinator';    // Orchestrates other agents

export interface AgentTask {
  id: string;
  role: AgentRole;
  objective: string;
  context: string;
  constraints?: string[];
  expectedOutput: string;
}

export interface AgentResult {
  taskId: string;
  role: AgentRole;
  output: string;
  confidence: number;
  reasoning: string;
  suggestedFollowUp?: string;
}

export interface MultiAgentPlan {
  id: string;
  objective: string;
  tasks: AgentTask[];
  executionOrder: string[]; // Task IDs in order
  estimatedTime: string;
}

const AGENT_PROMPTS: Record<AgentRole, string> = {
  researcher: `You are a Research Agent. Your role is to:
- Find relevant information and facts
- Synthesize multiple sources into coherent summaries
- Identify key insights and patterns
- Flag any uncertainties or gaps in information
Be thorough but concise. Cite your reasoning.`,

  writer: `You are a Writing Agent. Your role is to:
- Create clear, engaging content
- Adapt tone and style to the audience
- Structure information logically
- Edit and refine for clarity
Focus on quality and readability.`,

  analyst: `You are an Analysis Agent. Your role is to:
- Examine data and information critically
- Identify trends, patterns, and anomalies
- Provide data-driven insights
- Make evidence-based recommendations
Be objective and precise.`,

  planner: `You are a Planning Agent. Your role is to:
- Break down complex goals into actionable steps
- Create realistic timelines and milestones
- Identify dependencies and potential blockers
- Prioritize tasks effectively
Be practical and thorough.`,

  critic: `You are a Critic Agent. Your role is to:
- Review outputs for quality and accuracy
- Identify weaknesses and areas for improvement
- Suggest specific enhancements
- Ensure outputs meet objectives
Be constructive but honest.`,

  coordinator: `You are a Coordinator Agent. Your role is to:
- Orchestrate work across multiple agents
- Ensure coherent integration of outputs
- Resolve conflicts between agent recommendations
- Synthesize final deliverables
Focus on the big picture while maintaining quality.`,
};

export class MultiAgentSystem {
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
   * Create a multi-agent plan for a complex objective
   */
  async createPlan(objective: string, context: string): Promise<MultiAgentPlan> {
    const prompt = `You are a task planning system. Create a multi-agent execution plan for this objective:

OBJECTIVE: ${objective}

CONTEXT: ${context}

Available agent roles:
- researcher: Finds and synthesizes information
- writer: Creates content and documents
- analyst: Analyzes data and provides insights
- planner: Creates plans and breaks down goals
- critic: Reviews and improves outputs
- coordinator: Orchestrates and integrates

Create a plan with 2-5 tasks. Respond ONLY with valid JSON:
{
  "tasks": [
    {
      "id": "task-1",
      "role": "<agent role>",
      "objective": "<specific task objective>",
      "context": "<relevant context for this task>",
      "expectedOutput": "<what this task should produce>"
    }
  ],
  "executionOrder": ["task-1", "task-2"],
  "estimatedTime": "<estimated completion time>"
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.5,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid plan response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        id: `plan-${Date.now()}`,
        objective,
        tasks: parsed.tasks || [],
        executionOrder: parsed.executionOrder || [],
        estimatedTime: parsed.estimatedTime || 'Unknown',
      };
    } catch (error) {
      console.error('[MultiAgent] Plan creation failed:', error);
      // Return a simple single-task plan as fallback
      return {
        id: `plan-${Date.now()}`,
        objective,
        tasks: [{
          id: 'task-1',
          role: 'coordinator',
          objective,
          context,
          expectedOutput: 'Complete response to the objective',
        }],
        executionOrder: ['task-1'],
        estimatedTime: '1-2 minutes',
      };
    }
  }

  /**
   * Execute a single agent task
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    const agentPrompt = AGENT_PROMPTS[task.role];

    const prompt = `${agentPrompt}

YOUR TASK:
Objective: ${task.objective}

Context: ${task.context}

${task.constraints ? `Constraints:\n${task.constraints.map(c => `- ${c}`).join('\n')}` : ''}

Expected Output: ${task.expectedOutput}

Complete this task thoroughly. Provide your output, confidence level (0-100), and brief reasoning.

Respond in JSON format:
{
  "output": "<your complete output>",
  "confidence": <0-100>,
  "reasoning": "<brief explanation of your approach>",
  "suggestedFollowUp": "<optional: what should happen next>"
}`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.7,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          taskId: task.id,
          role: task.role,
          output: result.text,
          confidence: 70,
          reasoning: 'Direct output without structured response',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        taskId: task.id,
        role: task.role,
        output: parsed.output || result.text,
        confidence: parsed.confidence || 70,
        reasoning: parsed.reasoning || 'No reasoning provided',
        suggestedFollowUp: parsed.suggestedFollowUp,
      };
    } catch (error) {
      console.error(`[MultiAgent] Task ${task.id} failed:`, error);
      return {
        taskId: task.id,
        role: task.role,
        output: 'Task execution failed',
        confidence: 0,
        reasoning: `Error: ${error}`,
      };
    }
  }

  /**
   * Execute a full multi-agent plan
   */
  async executePlan(plan: MultiAgentPlan): Promise<{
    results: AgentResult[];
    finalOutput: string;
    overallConfidence: number;
  }> {
    const results: AgentResult[] = [];
    const taskOutputs: Record<string, string> = {};

    // Execute tasks in order
    for (const taskId of plan.executionOrder) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (!task) continue;

      // Add previous task outputs to context
      const previousOutputs = Object.entries(taskOutputs)
        .map(([id, output]) => `[${id}]: ${output.substring(0, 500)}`)
        .join('\n\n');

      const enrichedTask: AgentTask = {
        ...task,
        context: `${task.context}\n\nPrevious task outputs:\n${previousOutputs}`,
      };

      const result = await this.executeTask(enrichedTask);
      results.push(result);
      taskOutputs[taskId] = result.output;
    }

    // Synthesize final output
    const finalOutput = await this.synthesizeResults(plan.objective, results);
    const overallConfidence = Math.round(
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    );

    return { results, finalOutput, overallConfidence };
  }

  /**
   * Synthesize results from multiple agents into a coherent output
   */
  private async synthesizeResults(objective: string, results: AgentResult[]): Promise<string> {
    const prompt = `You are synthesizing outputs from multiple specialized agents into a coherent final response.

ORIGINAL OBJECTIVE: ${objective}

AGENT OUTPUTS:
${results.map(r => `
[${r.role.toUpperCase()} AGENT] (Confidence: ${r.confidence}%)
${r.output}
`).join('\n---\n')}

Create a unified, coherent response that:
1. Integrates the best insights from each agent
2. Resolves any conflicts between outputs
3. Presents information in a clear, actionable format
4. Addresses the original objective completely

Provide the final synthesized response:`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.5,
      });

      return result.text;
    } catch (error) {
      console.error('[MultiAgent] Synthesis failed:', error);
      // Return concatenated results as fallback
      return results.map(r => `**${r.role}**: ${r.output}`).join('\n\n');
    }
  }

  /**
   * Quick single-agent execution for simple tasks
   */
  async quickExecute(role: AgentRole, objective: string, context: string): Promise<string> {
    const task: AgentTask = {
      id: `quick-${Date.now()}`,
      role,
      objective,
      context,
      expectedOutput: 'Complete response',
    };

    const result = await this.executeTask(task);
    return result.output;
  }
}

/**
 * Factory function
 */
export const createMultiAgentSystem = (userId: string, tenantId: string): MultiAgentSystem => {
  return new MultiAgentSystem(userId, tenantId);
};
