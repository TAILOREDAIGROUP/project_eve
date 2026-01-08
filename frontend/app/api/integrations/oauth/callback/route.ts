import { NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { provider_id, tenant_id, connection_id } = await req.json();

  const secretKey = process.env.NANGO_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Nango not configured' }, { status: 500 });
  }

  const nango = new Nango({ secretKey });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Verify connection exists in Nango
    await nango.getConnection(provider_id, connection_id);

    // Save to our database
    const { data, error } = await supabase
      .from('integrations')
      .upsert({
        tenant_id,
        user_id: tenant_id,
        provider_id,
        status: 'connected',
        account_info: { connection_id },
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,provider_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, integration: data });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}
