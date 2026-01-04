/**
 * Knowledge Graph for Project Eve
 * Extracts entities and relationships from conversations
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';

export interface KnowledgeEntity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'project' | 'concept' | 'location' | 'date' | 'product' | 'other';
  description?: string;
  attributes: Record<string, string>;
  confidence: number;
  firstMentioned: string;
  lastMentioned: string;
  mentionCount: number;
}

export interface KnowledgeRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  description?: string;
  confidence: number;
  createdAt: string;
}

export interface KnowledgeContext {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  summary: string;
}

export class KnowledgeGraph {
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
   * Extract entities and relationships from a conversation
   */
  async extractKnowledge(userMessage: string, aiResponse: string): Promise<{
    entities: Partial<KnowledgeEntity>[];
    relationships: Partial<KnowledgeRelationship>[];
  }> {
    const prompt = `Analyze this conversation and extract named entities and their relationships.

USER MESSAGE: ${userMessage}

AI RESPONSE: ${aiResponse}

Extract:
1. ENTITIES: People, organizations, projects, concepts, locations, dates, products mentioned
2. RELATIONSHIPS: How entities relate to each other or to the user

Respond ONLY with valid JSON:
{
  "entities": [
    {
      "name": "<entity name>",
      "type": "<person|organization|project|concept|location|date|product|other>",
      "description": "<brief description>",
      "attributes": {"key": "value"},
      "confidence": <0-100>
    }
  ],
  "relationships": [
    {
      "source": "<source entity name>",
      "target": "<target entity name>",
      "type": "<relationship type: works_for, owns, located_in, related_to, etc>",
      "description": "<brief description>",
      "confidence": <0-100>
    }
  ]
}

If no entities or relationships found, return empty arrays.`;

    try {
      const result = await generateText({
        model: this.openrouter('google/gemini-2.0-flash-001'),
        prompt,
        temperature: 0.3,
      });

      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { entities: [], relationships: [] };

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        entities: parsed.entities || [],
        relationships: parsed.relationships || [],
      };
    } catch (error) {
      console.error('[KnowledgeGraph] Extraction failed:', error);
      return { entities: [], relationships: [] };
    }
  }

  /**
   * Store or update entities in the knowledge graph
   */
  async storeEntities(entities: Partial<KnowledgeEntity>[]): Promise<void> {
    if (entities.length === 0) return;

    const now = new Date().toISOString();

    for (const entity of entities) {
      if (!entity.name || entity.confidence! < 50) continue;

      try {
        // Check if entity already exists
        const { data: existing } = await supabase
          .from('knowledge_entities')
          .select('id, mention_count')
          .eq('tenant_id', this.tenantId)
          .ilike('name', entity.name)
          .single();

        if (existing) {
          // Update existing entity
          await supabase
            .from('knowledge_entities')
            .update({
              last_mentioned: now,
              mention_count: existing.mention_count + 1,
              confidence: Math.max(entity.confidence || 50, 50),
            })
            .eq('id', existing.id);
        } else {
          // Insert new entity
          await supabase.from('knowledge_entities').insert({
            id: crypto.randomUUID(),
            user_id: this.userId,
            tenant_id: this.tenantId,
            name: entity.name,
            type: entity.type || 'other',
            description: entity.description,
            attributes: entity.attributes || {},
            confidence: entity.confidence || 50,
            first_mentioned: now,
            last_mentioned: now,
            mention_count: 1,
          });
        }
      } catch (error) {
        console.error('[KnowledgeGraph] Failed to store entity:', error);
      }
    }
  }

  /**
   * Store relationships between entities
   */
  async storeRelationships(relationships: Partial<KnowledgeRelationship>[]): Promise<void> {
    if (relationships.length === 0) return;

    for (const rel of relationships) {
      if (!rel.sourceEntityId || !rel.targetEntityId || rel.confidence! < 50) continue;

      try {
        // Check if relationship already exists
        const { data: existing } = await supabase
          .from('knowledge_relationships')
          .select('id')
          .eq('tenant_id', this.tenantId)
          .eq('source_entity_id', rel.sourceEntityId)
          .eq('target_entity_id', rel.targetEntityId)
          .eq('relationship_type', rel.relationshipType)
          .single();

        if (!existing) {
          await supabase.from('knowledge_relationships').insert({
            id: crypto.randomUUID(),
            tenant_id: this.tenantId,
            source_entity_id: rel.sourceEntityId,
            target_entity_id: rel.targetEntityId,
            relationship_type: rel.relationshipType,
            description: rel.description,
            confidence: rel.confidence || 50,
            created_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('[KnowledgeGraph] Failed to store relationship:', error);
      }
    }
  }

  /**
   * Process a conversation and update the knowledge graph
   */
  async processConversation(userMessage: string, aiResponse: string): Promise<void> {
    const { entities, relationships } = await this.extractKnowledge(userMessage, aiResponse);
    
    // Store entities first
    await this.storeEntities(entities);

    // Then resolve entity IDs for relationships and store them
    for (const rel of relationships) {
      const { data: sourceEntity } = await supabase
        .from('knowledge_entities')
        .select('id')
        .eq('tenant_id', this.tenantId)
        .ilike('name', (rel as any).source)
        .single();

      const { data: targetEntity } = await supabase
        .from('knowledge_entities')
        .select('id')
        .eq('tenant_id', this.tenantId)
        .ilike('name', (rel as any).target)
        .single();

      if (sourceEntity && targetEntity) {
        await this.storeRelationships([{
          sourceEntityId: sourceEntity.id,
          targetEntityId: targetEntity.id,
          relationshipType: (rel as any).type,
          description: rel.description,
          confidence: rel.confidence,
        }]);
      }
    }
  }

  /**
   * Query the knowledge graph for relevant context
   */
  async queryRelevantKnowledge(query: string, limit: number = 10): Promise<KnowledgeEntity[]> {
    try {
      // Simple keyword-based search (in production, use vector similarity)
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      if (keywords.length === 0) {
        // Return most frequently mentioned entities
        const { data } = await supabase
          .from('knowledge_entities')
          .select('*')
          .eq('tenant_id', this.tenantId)
          .order('mention_count', { ascending: false })
          .limit(limit);

        return data || [];
      }

      // Search for entities matching keywords
      const { data } = await supabase
        .from('knowledge_entities')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .or(keywords.map(k => `name.ilike.%${k}%`).join(','))
        .order('mention_count', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('[KnowledgeGraph] Query failed:', error);
      return [];
    }
  }

  /**
   * Get relationships for a specific entity
   */
  async getEntityRelationships(entityId: string): Promise<KnowledgeRelationship[]> {
    try {
      const { data } = await supabase
        .from('knowledge_relationships')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);

      return data || [];
    } catch (error) {
      console.error('[KnowledgeGraph] Failed to get relationships:', error);
      return [];
    }
  }

  /**
   * Generate knowledge context for system prompt
   */
  async getKnowledgeContext(query: string): Promise<string> {
    const entities = await this.queryRelevantKnowledge(query, 5);
    
    if (entities.length === 0) return '';

    let context = '\n## KNOWLEDGE GRAPH CONTEXT\n';
    context += 'Relevant entities from previous conversations:\n';

    for (const entity of entities) {
      context += `- ${entity.name} (${entity.type}): ${entity.description || 'No description'}\n`;
      
      // Get relationships for this entity
      const relationships = await this.getEntityRelationships(entity.id);
      if (relationships.length > 0) {
        relationships.slice(0, 2).forEach(rel => {
          context += `  → ${rel.relationshipType}: ${rel.description || ''}\n`;
        });
      }
    }

    return context;
  }

  /**
   * Get knowledge graph statistics
   */
  async getStats(): Promise<{
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
  }> {
    try {
      const { data: entities } = await supabase
        .from('knowledge_entities')
        .select('type')
        .eq('tenant_id', this.tenantId);

      const { count: relationshipCount } = await supabase
        .from('knowledge_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.tenantId);

      const entityTypes: Record<string, number> = {};
      (entities || []).forEach(e => {
        entityTypes[e.type] = (entityTypes[e.type] || 0) + 1;
      });

      return {
        totalEntities: entities?.length || 0,
        totalRelationships: relationshipCount || 0,
        entityTypes,
      };
    } catch (error) {
      console.error('[KnowledgeGraph] Failed to get stats:', error);
      return { totalEntities: 0, totalRelationships: 0, entityTypes: {} };
    }
  }
}

/**
 * Factory function
 */
export const createKnowledgeGraph = (userId: string, tenantId: string): KnowledgeGraph => {
  return new KnowledgeGraph(userId, tenantId);
};
