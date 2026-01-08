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

// Providers that are currently disabled (not configured in Nango yet)
const DISABLED_PROVIDERS = ['microsoft365', 'quickbooks', 'zendesk'];

// Default providers if database is not available
const DEFAULT_PROVIDERS = [
  { id: 'google', name: 'Google Workspace', icon: '🔵', description: 'Gmail, Google Drive, Calendar', category: 'productivity' },
  { id: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'CRM - Deals, Contacts, Companies', category: 'crm' },
  { id: 'notion', name: 'Notion', icon: '⬛', description: 'Documents and databases', category: 'productivity' },
  { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'Orders, Products, Customers', category: 'finance' },
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Messages and channels', category: 'communication' },
];

export async function GET() {
  const db = getSupabase();

  if (db) {
    try {
      const { data, error } = await db
        .from('integration_providers')
        .select('*')
        .eq('is_enabled', true)
        .order('name');

      if (!error && data && data.length > 0) {
        // Filter out disabled providers
        const enabledProviders = data.filter(p => !DISABLED_PROVIDERS.includes(p.id));
        return NextResponse.json({ providers: enabledProviders });
      }
    } catch (e) {
      console.error('Error fetching providers:', e);
    }
  }

  // Return default providers (already filtered)
  return NextResponse.json({ providers: DEFAULT_PROVIDERS });
}
