
import { OpenAI } from 'openai';
import { retrieveContext } from '@/lib/rag';
import { getUserMemories, saveUserMemory } from '@/lib/memory';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        // Initialize OpenAI client with OpenRouter configuration at runtime
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });

        const { messages, tenant_id } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Placeholder User ID (In a real app, verify Auth header)
        const userId = 'default-user-id';

        // 1. Parallel Retrieval: Get Memories and Document Context
        const [memories, contextChunks] = await Promise.all([
            getUserMemories(userId),
            retrieveContext(userQuery)
        ]);

        // 2. Construct System Prompt
        const memorySection = memories.length > 0
            ? `\n\nUSER FACTS (Memory):\n- ${memories.join('\n- ')}`
            : '';

        const contextSection = contextChunks.length > 0
            ? `\n\nRELEVANT DOCUMENT EXCERPTS:\n${contextChunks.join('\n\n---\n\n')}`
            : '\n\n(No specific document context found. Answer based on general knowledge if possible, or ask for the document.)';

        const systemPrompt = `You are an advanced Enterprise AI Assistant for Project EVE.
    Your goal is to assist the user by analyzing their documents and providing accurate, policy-compliant answers.
    ${memorySection}
    ${contextSection}
    
    INSTRUCTIONS:
    - Use the provided DOCUMENT EXCERPTS to answer the query. 
    - If the answer is found in the documents, cite the specific clause or section if valid.
    - If the user asks about themselves, refer to the USER FACTS.
    - If the "RELEVANT DOCUMENT EXCERPTS" section is empty, politely inform the user that you don't have the specific document info yet.
    - Be concise, professional, and helpful.
    `;

        // 3. Prepare Message History
        // We keep the last few messages but inject our super-system prompt at the start
        const completionMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5) // Keep last 5 messages for context
        ];

        // 4. Stream Response
        const response = await openai.chat.completions.create({
            model: 'google/gemini-flash-1.5',
            stream: true,
            messages: completionMessages,
        });

        const stream = new ReadableStream({
            async start(controller) {
                let fullText = '';
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();

                // 5. Self-Correction / Learner (Fire and Forget)
                // Check if user stated a fact, e.g., "I am the [Role]" or "My budget is [Amount]"
                // This is a naive heuristic for the demo.
                if (userQuery.toLowerCase().includes("i am the") || userQuery.toLowerCase().includes("my name is")) {
                    // We use 'waitUntil' or similar in Edge, but pure async call usually works if not awaited 
                    // depending on runtime. For safety in Vercel Edge, we just call it.
                    saveUserMemory(userId, userQuery).catch(console.error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        // Return actual error message for debugging
        return new Response(JSON.stringify({ error: error.message || "Unknown Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
