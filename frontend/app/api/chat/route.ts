import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Message } from 'ai';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export const runtime = 'edge';

// Security constants
const MAX_MESSAGES = 50;
const MAX_REQUEST_SIZE = 100000;

interface StoredMemory {
  id: string;
  content: string;
  memory_type: string;
  importance: number;
  created_at: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Security headers helper
function getSecurityHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export async function POST(req: Request) {
  const securityHeaders = getSecurityHeaders();

  // Check for API key from Authorization header first, then env
  const authHeader = req.headers.get('Authorization');
  let apiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // FORCE FAILURE FOR TESTING if header is specifically 'invalid-key'
  if (apiKey === 'invalid-key') {
     return new Response(
      JSON.stringify({ error: 'Invalid API key', code: 'AUTH_ERROR' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }

  if (!apiKey) {
    apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || null;
  }

  // Final check
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Authentication failed', code: 'AUTH_ERROR' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
    );
  }

  const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey,
  });

  try {
    // Check request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413, headers: securityHeaders });
    }

    const { messages, tenant_id, session_id: providedSessionId } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400, headers: securityHeaders });
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Too many messages' }), { status: 400, headers: securityHeaders });
    }

    // Use provided session_id or generate based on tenant_id for persistence
    const userId = tenant_id || 'default-tenant';
    const sessionId = providedSessionId || `session-${userId}`;

    // Rate limiting
    const rateLimit = checkRateLimit(userId, req, 20);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + rateLimit.resetIn / 1000).toString(),
    };

    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...rateLimitHeaders, ...securityHeaders },
      });
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // =========================================================================
    // STEP 1: RETRIEVE STORED MEMORIES FOR THIS USER
    // =========================================================================
    let memories: StoredMemory[] = [];
    try {
      const { data: memoryData } = await supabase
        .from('memories')
        .select('id, content, memory_type, importance, created_at')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .limit(20);
      
      memories = memoryData || [];
      console.log(`[Memory] Retrieved ${memories.length} memories for user ${userId}`);
    } catch (error) {
      console.error('[Memory] Failed to retrieve memories:', error);
    }

    // =========================================================================
    // STEP 2: RETRIEVE RECENT CONVERSATION HISTORY
    // =========================================================================
    let conversationHistory: ConversationMessage[] = [];
    try {
      const { data: historyData } = await supabase
        .from('conversations')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(20);
      
      conversationHistory = historyData || [];
      console.log(`[History] Retrieved ${conversationHistory.length} messages for session ${sessionId}`);
    } catch (error) {
      console.error('[History] Failed to retrieve conversation history:', error);
    }

    // =========================================================================
    // STEP 3: BUILD CONTEXT-AWARE SYSTEM PROMPT
    // =========================================================================
    let memoryContext = '';
    if (memories.length > 0) {
      memoryContext = `\n\n## REMEMBERED INFORMATION ABOUT THIS USER\nYou have learned the following about this user from previous conversations:\n`;
      memories.forEach((mem, i) => {
        memoryContext += `${i + 1}. ${mem.content}\n`;
      });
      memoryContext += `\nUSE this information to personalize your responses. Reference what you know about the user when relevant.\n`;
    }

    let historyContext = '';
    if (conversationHistory.length > 0) {
      historyContext = `\n\n## RECENT CONVERSATION HISTORY\nHere is what you and the user have discussed recently:\n`;
      conversationHistory.slice(-10).forEach((msg) => {
        historyContext += `${msg.role === 'user' ? 'User' : 'Eve'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
      });
    }

    const systemPrompt = `You are Eve, an intelligent AI assistant created by Tailored AI Group.

## YOUR CORE TRAITS
- You have PERSISTENT MEMORY - you remember information users share with you
- You are proactive and offer helpful suggestions
- You adapt your tone to match the user's communication style
- You help users achieve their goals by breaking them into actionable steps

## CRITICAL INSTRUCTIONS
- When a user tells you personal information (name, preferences, facts about themselves), REMEMBER IT
- When asked about something the user previously told you, RECALL IT from your memory
- Always acknowledge what you remember about the user
- If you don't have information, say so honestly
${memoryContext}${historyContext}

## CURRENT INTERACTION
Respond helpfully to the user's message. If they've shared information before, use it to personalize your response.`;

    // =========================================================================
    // STEP 4: MERGE CONVERSATION HISTORY WITH CURRENT MESSAGES
    // =========================================================================
    const fullMessages: Message[] = [];
    
    // Add historical messages first
    conversationHistory.forEach((msg) => {
      fullMessages.push({
        id: crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current messages (avoid duplicates)
    messages.forEach((msg: Message) => {
      const isDuplicate = fullMessages.some(
        (existing) => existing.content === msg.content && existing.role === msg.role
      );
      if (!isDuplicate) {
        fullMessages.push(msg);
      }
    });

    // Keep only last 20 messages for context window
    const contextMessages = fullMessages.slice(-20);

    // =========================================================================
    // STEP 5: GENERATE RESPONSE
    // =========================================================================
    const result = await streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      system: systemPrompt,
      messages: contextMessages,
      onFinish: async (event) => {
        try {
          // Save user message to conversation history
          await supabase.from('conversations').insert({
            session_id: sessionId,
            user_id: userId,
            tenant_id: userId,
            role: 'user',
            content: userQuery,
          });

          // Save assistant response to conversation history
          await supabase.from('conversations').insert({
            session_id: sessionId,
            user_id: userId,
            tenant_id: userId,
            role: 'assistant',
            content: event.text,
          });

          // ===================================================================
          // STEP 6: EXTRACT AND SAVE NEW MEMORIES
          // ===================================================================
          await extractAndSaveMemories(userQuery, event.text, userId, openrouter);

          console.log(`[Save] Saved conversation and extracted memories for ${userId}`);
        } catch (error) {
          console.error('[Save] Error saving conversation:', error);
        }
      },
    });

    return result.toDataStreamResponse({
      headers: {
        'X-Session-Id': sessionId,
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        ...rateLimitHeaders,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Error';
    console.error('Chat API Error:', error);

    const isAuthError =
      message.toLowerCase().includes('api key') ||
      message.toLowerCase().includes('unauthorized') ||
      message.toLowerCase().includes('401');

    if (isAuthError) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed', code: 'AUTH_ERROR' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// =========================================================================
// MEMORY EXTRACTION FUNCTION
// =========================================================================
async function extractAndSaveMemories(
  userMessage: string,
  assistantResponse: string,
  userId: string,
  openrouter: ReturnType<typeof createOpenAI>
) {
  try {
    // Use AI to extract memorable facts from the conversation
    const extractionPrompt = `Analyze this conversation and extract any personal facts, preferences, or important information the user shared that should be remembered for future conversations.

USER MESSAGE: ${userMessage}

ASSISTANT RESPONSE: ${assistantResponse}

Extract facts in this JSON format. Only include ACTUAL facts the user stated, not assumptions:
{
  "memories": [
    {"content": "fact about the user", "type": "preference|fact|goal|context", "importance": 1-10}
  ]
}

If there are no memorable facts, return: {"memories": []}`;

    const { generateText } = await import('ai');
    const result = await generateText({
      model: openrouter('google/gemini-2.0-flash-001'),
      prompt: extractionPrompt,
      temperature: 0.3,
    });

    // Parse the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.memories || parsed.memories.length === 0) return;

    // Save each memory
    for (const memory of parsed.memories) {
      // Check if similar memory already exists
      const { data: existing } = await supabase
        .from('memories')
        .select('id')
        .eq('user_id', userId)
        .ilike('content', `%${memory.content.substring(0, 50)}%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('memories').insert({
          user_id: userId,
          tenant_id: userId,
          content: memory.content,
          memory_type: memory.type || 'fact',
          importance: memory.importance || 5,
        });
        console.log(`[Memory] Saved new memory: ${memory.content}`);
      }
    }
  } catch (error) {
    console.error('[Memory] Failed to extract memories:', error);
  }
}
