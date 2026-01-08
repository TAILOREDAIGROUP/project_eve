# EVE Integration Architecture

## Overview
EVE uses Nango (https://nango.dev) as the unified integration layer for all third-party connections. Nango handles OAuth 2.0 flows, token refresh, rate limiting, and provides a single API for all integrations.

## Configured Integrations
The following integrations are configured in Nango (dev environment):

| Provider | Nango ID | Scopes | Features |
|----------|----------|--------|----------|
| Google | `google` | calendar, gmail, drive | Calendar sync, email drafts, file access |
| Slack | `slack` | channels:read, chat:write | Thread summarization, message drafts |
| HubSpot | `hubspot` | crm.objects.deals.read | Deal flow analysis |
| Microsoft | `microsoft` | calendars.read, mail.read | Outlook integration |
| Notion | `notion` | read_content | Knowledge base sync |
| Shopify | `shopify` | orders, customers | Order tracking |
| GitHub | `github-getting-started` | repo, user | PR and Issue tracking |

## Connection Flow
1. **Initiation**: User clicks "Connect" on an integration card in `/dashboard/integrations`.
2. **OAuth Popup**: The Nango Frontend SDK opens a popup to the provider's OAuth screen.
3. **Authorization**: User authorizes EVE to access their data.
4. **Callback**: Nango handles the OAuth callback, stores the tokens securely, and provides a `connection_id`.
5. **Persistence**: The frontend calls `POST /api/integrations/oauth/callback` to save the connection status in EVE's Supabase database.
6. **Data Sync**: EVE backend uses the Nango Node.js SDK to fetch data from the provider using the stored connection.

## Environment Variables
- `NEXT_PUBLIC_NANGO_PUBLIC_KEY`: Used by the frontend SDK to initiate connections.
- `NANGO_SECRET_KEY`: Used by the backend SDK to fetch data and manage connections.
- `NANGO_HOST`: (Optional) Defaults to `https://api.nango.dev`.

## API Routes
- `GET /api/integrations/providers`: List all available integration providers.
- `GET /api/integrations`: List current user's active integrations.
- `POST /api/integrations/oauth/callback`: Save a successful connection from Nango.
- `DELETE /api/integrations/:id`: Disconnect an integration.
- `POST /api/integrations/connect`: Simulated connection fallback (when Nango is not configured).

## EVE Awareness
EVE is made aware of connected integrations through the system prompt in `app/api/chat/route.ts`. (Note: Implementation in progress to include active integrations in the context).
