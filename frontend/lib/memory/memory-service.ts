import { supabase } from '@/lib/supabase';
import { OpenAI } from 'openai';

export interface Memory {
    id: string;
    content: string;
    memory_type: string;
    confidence: number;
    metadata: Record<string, any>;
    similarity?: number;
    interaction_count: number;
    last_accessed_at: string;
    created_at: string;
}

export interface AgentState {
    user_id: string;
    tenant_id: string;
    current_goals: any[];
    active_tasks: any[];
    short_term_context: string;
    last_interaction_at: string;
    metadata: Record<string, any>;
}

export interface Message {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: Record<string, any>;
    created_at: string;
}

export class MemoryService {
    private userId: string;
    private tenantId: string;
    private openai: OpenAI;

    constructor(userId: string, tenantId: string = 'default-tenant') {
        this.userId = userId;
        this.tenantId = tenantId;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
    }

    private async getEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });
        return response.data[0].embedding;
    }

    /**
     * Retrieve relevant memories using vector search
     */
    async retrieveMemories(query: string, limit: number = 5, threshold: number = 0.5): Promise<Memory[]> {
        try {
            const embedding = await this.getEmbedding(query);
            const { data, error } = await supabase.rpc('match_memories', {
                query_embedding: embedding,
                match_threshold: threshold,
                match_count: limit,
            });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error retrieving memories:', error);
            return [];
        }
    }

    /**
     * Save a new memory
     */
    async saveMemory(content: string, metadata: Record<string, any> = {}): Promise<void> {
        try {
            const embedding = await this.getEmbedding(content);
            const { error } = await supabase.from('user_memory').insert({
                user_id: this.userId,
                tenant_id: this.tenantId,
                content,
                embedding,
                metadata,
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving memory:', error);
        }
    }

    /**
     * Increment interaction count for a memory
     */
    async incrementInteraction(memoryId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc('increment_interaction', {
                memory_id: memoryId,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error incrementing interaction:', error);
        }
    }

    /**
     * Get or create agent state
     */
    async getAgentState(): Promise<AgentState> {
        try {
            const { data, error } = await supabase
                .from('agent_state')
                .select('*')
                .eq('user_id', this.userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) {
                const newState = {
                    user_id: this.userId,
                    tenant_id: this.tenantId,
                    current_goals: [],
                    active_tasks: [],
                    short_term_context: '',
                    metadata: {},
                };
                const { data: createdData, error: createError } = await supabase
                    .from('agent_state')
                    .insert(newState)
                    .select()
                    .single();
                
                if (createError) throw createError;
                return createdData;
            }

            return data;
        } catch (error) {
            console.error('Error getting agent state:', error);
            return this.getDefaultAgentState();
        }
    }

    private getDefaultAgentState(): AgentState {
        return {
            user_id: this.userId,
            tenant_id: this.tenantId,
            current_goals: [],
            active_tasks: [],
            short_term_context: '',
            last_interaction_at: new Date().toISOString(),
            metadata: {},
        };
    }

    /**
     * Update agent state
     */
    async updateAgentState(updates: Partial<AgentState>): Promise<void> {
        try {
            const { error } = await supabase
                .from('agent_state')
                .update({
                    ...updates,
                    last_interaction_at: new Date().toISOString(),
                })
                .eq('user_id', this.userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating agent state:', error);
        }
    }

    /**
     * Create a new conversation session
     */
    async createSession(title?: string): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('conversation_sessions')
                .insert({
                    user_id: this.userId,
                    tenant_id: this.tenantId,
                    title,
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error('Error creating session:', error);
            return `fallback-${Date.now()}`;
        }
    }

    /**
     * Save a message
     */
    async saveMessage(sessionId: string, role: Message['role'], content: string, metadata: Record<string, any> = {}): Promise<void> {
        try {
            const { error } = await supabase.from('messages').insert({
                session_id: sessionId,
                tenant_id: this.tenantId,
                role,
                content,
                metadata,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }

    /**
     * Extract memories (Placeholder for LLM-based extraction)
     */
    async extractMemoriesFromMessage(userMessage: string, assistantResponse: string): Promise<void> {
        // Implementation will be handled in Phase 3 with LLM
        console.log('Memory extraction requested for:', userMessage.substring(0, 50));
    }
}
