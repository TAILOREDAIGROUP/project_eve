import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

export async function GET() {
  const db = getSupabase();
  
  if (!db) {
    // Return default providers if no database
    return NextResponse.json({
      providers: [
        { id: 'google', name: 'Google Workspace', icon: '🔵', description: 'Gmail, Drive, Calendar', category: 'productivity' },
        { id: 'slack', name: 'Slack', icon: '💬', description: 'Messages and channels', category: 'communication' },
        { id: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'CRM - Deals, Contacts', category: 'crm' },
        { id: 'quickbooks', name: 'QuickBooks', icon: '💚', description: 'Invoices, Expenses', category: 'finance' },
        { id: 'notion', name: 'Notion', icon: '⬛', description: 'Documents and databases', category: 'productivity' },
        { id: 'zendesk', name: 'Zendesk', icon: '🎫', description: 'Support tickets', category: 'crm' },
        { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'Orders, Products', category: 'finance' },
        { id: 'microsoft365', name: 'Microsoft 365', icon: '🔷', description: 'Outlook, OneDrive, Teams', category: 'productivity' },
      ]
    });
  }

  try {
    const { data, error } = await db
      .from('integration_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('name');

    if (error) {
      return NextResponse.json({ providers: [] });
    }

    return NextResponse.json({ providers: data || [] });
  } catch (error) {
    return NextResponse.json({ providers: [] });
  }
}
