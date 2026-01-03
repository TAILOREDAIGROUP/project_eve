import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { AgentInitializer } from '@/lib/agent/initializer';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'edge';

export async function POST(req: Request) {
    // Check for API key FIRST
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('OPENROUTER_API_KEY is not set');
        return new Response(
            JSON.stringify({ error: 'Server configuration error: OPENROUTER_API_KEY is not set' }),
            { 
                status: 500, 
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Content-Type-Options': 'nosniff'
                } 
            }
        );
    }

    // Configure OpenRouter with the verified API key
    const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
    });

    try {
        const { messages, tenant_id } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Get user ID
        const userId = tenant_id || 'default-user-id';
        const tenantId = tenant_id || 'default-tenant';

        // Rate Limiting
        const rateLimit = checkRateLimit(userId, req);
        const rateLimitHeaders = {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + rateLimit.resetIn / 1000).toString(),
        };

        if (!rateLimit.allowed) {
            return new Response(JSON.stringify({ error: 'Too many requests' }), { 
                status: 429,
                headers: { 
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
                    'X-Content-Type-Options': 'nosniff',
                    ...rateLimitHeaders
                }
            });
        }

        // =====================================================================
        // BOOT-UP RITUAL: Initialize agent with memory and context
        // =====================================================================
        const initializer = new AgentInitializer(userId, tenantId);
        const bootContext = await initializer.bootUp(userQuery);

        // =====================================================================
        // STREAM RESPONSE
        // =====================================================================
        const result = await streamText({
            model: openrouter('google/gemini-2.0-flash-001'),
            system: bootContext.systemPrompt,
            messages: messages.slice(-10),
            onFinish: async (event) => {
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
                'Content-Security-Policy': "default-src 'self'",
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                ...rateLimitHeaders
            },
        });

    } catch (error: any) {
        const message = error instanceof Error ? error.message : 'Unknown Error';
        console.error('Chat API Error:', error);

        // Check for authentication/API key errors
        const isAuthError = message.toLowerCase().includes('api key') || 
                          message.toLowerCase().includes('unauthorized') || 
                          message.toLowerCase().includes('authentication') || 
                          message.toLowerCase().includes('401');

        if (isAuthError) {
            return new Response(
                JSON.stringify({ 
                    error: 'Authentication failed. Please check your API key configuration.',
                    code: 'AUTH_ERROR' 
                }),
                { 
                    status: 401, 
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Content-Type-Options': 'nosniff'
                    } 
                }
            );
        }

        return new Response(
            JSON.stringify({
                error: message,
            }),
            {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Content-Type-Options': 'nosniff'
                }
            }
        );
    }
}
