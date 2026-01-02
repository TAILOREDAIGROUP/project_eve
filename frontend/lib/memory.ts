import { supabase } from './supabase';

export async function getUserMemories(userId: string) {
    const { data, error } = await supabase
        .from('user_memory')
        .select('fact_value, confidence_score')
        .eq('user_id', userId)
        .gt('confidence_score', 0.8) // Only return high confidence memories
        .limit(10);

    if (error) {
        console.error('Error fetching memory:', error);
        return [];
    }

    return data.map((m: any) => m.fact_value);
}

export async function saveUserMemory(userId: string, content: string) {
    // Simple "fact extraction" simulation - in a real agent, we'd use an LLM here too.
    // For now, we trust the input is a fact.

    const { error } = await supabase.from('user_memory').insert({
        user_id: userId,
        fact_key: 'participant_role', // Simplified for demo
        fact_value: content,
        confidence_score: 1.0,
    });

    if (error) {
        console.error('Error saving memory:', error);
    }
}
