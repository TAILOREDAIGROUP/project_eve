import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import { auth, currentUser } from '@clerk/nextjs/server';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a connect session for this user
    const session = await nango.createConnectSession({
      end_user: {
        id: userId,
        email: user?.emailAddresses[0]?.emailAddress || undefined,
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
