import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { AgentInitializer } from '@/lib/agent/initializer';

export const runtime = 'edge';

export async function POST(req: Request) {
    // Check for API key FIRST
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('OPENROUTER_API_KEY is not set');
        return new Response(
            JSON.stringify({ error: 'Server configuration error: OPENROUTER_API_KEY is not set' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Configure OpenRouter with the verified API key
    // This works because OpenRouter is OpenAI-compatible
    const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey, // Use the variable we already checked
    });

    try {
        const { messages, tenant_id } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Get user ID (in production, extract from auth token)
        const userId = tenant_id || 'default-user-id';
        const tenantId = tenant_id || 'default-tenant';

        // =====================================================================
        // BOOT-UP RITUAL: Initialize agent with memory and context
        // =====================================================================
        const initializer = new AgentInitializer(userId, tenantId);
        const bootContext = await initializer.bootUp(userQuery);

        // =====================================================================
        // STREAM RESPONSE
        // =====================================================================
        const result = await streamText({
            model: openrouter('google/gemini-flash-1.5'), // Or your preferred model via OpenRouter
            system: bootContext.systemPrompt,
            messages: messages.slice(-10), // Keep last 10 messages for context
            onFinish: async (event) => {
                // =============================================================
                // POST-INTERACTION: Extract and save memories
                // =============================================================
                try {
                    await initializer.postInteraction(
                        bootContext.sessionId,
                        userQuery,
                        event.text
                    );
                } catch (memoryError) {
                    console.error('Memory extraction failed:', memoryError);
                }
            },
        });

        return result.toDataStreamResponse({
            headers: {
                'X-Session-Id': bootContext.sessionId,
                'X-Interaction-Count': (bootContext.agentState.metadata?.interaction_count || 0).toString(),
            },
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);

        return new Response(
            JSON.stringify({
                error: error.message || 'Unknown Error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
