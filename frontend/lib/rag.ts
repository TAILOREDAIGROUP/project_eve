import { supabase } from './supabase';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export async function retrieveContext(query: string) {
    try {
        // 1. Generate Embedding
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });

        const embedding = embeddingResponse.data[0].embedding;

        // 2. Query Supabase
        const { data: documents, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: 0.5, // Minimum similarity threshold
            match_count: 5,
        });

        if (error) {
            console.error('Supabase RAG Error:', error);
            return [];
        }

        return documents?.map((doc: any) => doc.content) || [];
    } catch (error) {
        console.error('RAG Retrieval Failed:', error);
        // Fail gracefully by returning empty context rather than crashing
        return [];
    }
}
