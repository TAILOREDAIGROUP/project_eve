import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  // Base URL is not needed if using standard OpenAI, but plan mentions OpenRouter
  // I will use what's in .env which seems to be OpenRouter but labeled as OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { summarize = true } = await request.json().catch(() => ({}));

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionId = userId;

    // Check if Slack is connected
    try {
      await nango.getConnection('slack', connectionId);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Slack not connected',
        message: 'Please connect Slack at /dashboard/integrations'
      }, { status: 404 });
    }

    // Get list of channels the bot is in
    const channelsResponse = await nango.proxy({
      providerConfigKey: 'slack',
      connectionId: connectionId,
      method: 'GET',
      endpoint: '/conversations.list',
      params: {
        types: 'public_channel,private_channel',
        limit: '100'
      }
    });

    const channels = channelsResponse.data.channels || [];
    const threads: any[] = [];

    // Fetch recent messages from each channel (limit to first 5 channels)
    for (const channel of channels.slice(0, 5)) {
      try {
        const historyResponse = await nango.proxy({
          providerConfigKey: 'slack',
          connectionId: connectionId,
          method: 'GET',
          endpoint: '/conversations.history',
          params: {
            channel: channel.id,
            limit: '20'
          }
        });

        const messages = historyResponse.data.messages || [];
        
        // Find messages with thread replies
        const threadedMessages = messages.filter((m: any) => m.thread_ts && m.reply_count > 0);
        
        for (const msg of threadedMessages.slice(0, 3)) {
          threads.push({
            channelId: channel.id,
            channelName: channel.name,
            threadTs: msg.thread_ts,
            messageCount: msg.reply_count,
            latestReply: msg.latest_reply,
            preview: msg.text?.substring(0, 100) || ''
          });
        }
      } catch (err) {
        console.warn(`[Slack] Could not fetch history for channel ${channel.name}`);
      }
    }

    // Optionally summarize threads using AI
    let summaries: any[] = [];
    if (summarize && threads.length > 0) {
      const threadTexts = threads.map(t => 
        `Channel #${t.channelName}: "${t.preview}" (${t.messageCount} replies)`
      ).join('\n');

      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes Slack threads concisely. Provide a brief summary of each thread in 1-2 sentences.'
          },
          {
            role: 'user',
            content: `Summarize these Slack threads:\n\n${threadTexts}`
          }
        ],
        max_tokens: 500
      });

      summaries = [{
        summary: completion.choices[0]?.message?.content || 'Unable to generate summary',
        threadCount: threads.length
      }];
    }

    return NextResponse.json({
      success: true,
      threads: threads,
      summaries: summaries,
      count: threads.length
    });

  } catch (error: any) {
    console.error('[Slack Threads] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Slack threads',
      details: error.message 
    }, { status: 500 });
  }
}
