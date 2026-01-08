import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userEmail } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Create a connect session for this user
    const session = await nango.createConnectSession({
      end_user: {
        id: tenantId,
        email: userEmail || undefined,
      },
    });

    return NextResponse.json({ 
      sessionToken: session.data.token 
    });
  } catch (error) {
    console.error('[Nango Session] Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
