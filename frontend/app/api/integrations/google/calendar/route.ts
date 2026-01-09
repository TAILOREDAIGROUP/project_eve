import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import { auth } from '@clerk/nextjs/server';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connection ID format must match what was used during OAuth
    const connectionId = userId;

    // Check if Google is connected for this tenant
    try {
      const connection = await nango.getConnection('google', connectionId);
      console.log('[Google Calendar] Connection found:', connection.connection_id);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Google not connected',
        message: 'Please connect Google Workspace at /dashboard/integrations'
      }, { status: 404 });
    }

    // Fetch calendar events using Nango proxy
    // Nango handles token refresh automatically
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await nango.proxy({
      providerConfigKey: 'google',
      connectionId: connectionId,
      method: 'GET',
      endpoint: '/calendar/v3/calendars/primary/events',
      params: {
        timeMin: now.toISOString(),
        timeMax: oneWeekFromNow.toISOString(),
        maxResults: '20',
        singleEvents: 'true',
        orderBy: 'startTime'
      }
    });

    const events = response.data.items || [];

    // Transform to a cleaner format
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      attendees: event.attendees?.map((a: any) => a.email) || [],
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null
    }));

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      count: formattedEvents.length
    });

  } catch (error: any) {
    console.error('[Google Calendar] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar',
      details: error.message 
    }, { status: 500 });
  }
}
