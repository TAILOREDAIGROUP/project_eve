import Nango from '@nangohq/frontend';

let nango: Nango | null = null;

export function getNango(): Nango | null {
  if (typeof window === 'undefined') return null;
  if (!nango) {
    const publicKey = process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY;
    if (!publicKey) return null;
    nango = new Nango({ publicKey });
  }
  return nango;
}

// Map our provider IDs to Nango Integration IDs
// These MUST match the "ID" column in your Nango dashboard
export const PROVIDER_MAP: Record<string, string> = {
  'google': 'google',           // Matches Nango ID: google
  'hubspot': 'hubspot',         // Matches Nango ID: hubspot
  'notion': 'notion',           // Matches Nango ID: notion
  'shopify': 'shopify',         // Matches Nango ID: shopify
  'slack': 'slack',             // Matches Nango ID: slack
  // Disabled for now (not configured):
  // 'microsoft365': 'microsoft',
  // 'quickbooks': 'quickbooks',
  // 'zendesk': 'zendesk',
};
