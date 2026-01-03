import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export async function retrieveContext(query: string) {
    try {
        // For Edge runtime compatibility, we'll delegate to backend API
        // In production, this should call your Python backend's RAG endpoint
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/api/v1/rag/retrieve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.warn('RAG backend not available, continuing without document context');
            return [];
        }

        const data = await response.json();
        return data.chunks || [];
    } catch (error) {
        console.error('RAG Retrieval Failed:', error);
        // Fail gracefully by returning empty context rather than crashing
        return [];
    }
}

