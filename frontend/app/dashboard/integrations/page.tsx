'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  RefreshCw, 
  Shield,
  Zap,
  AlertCircle,
  Mail,
  MessageSquare,
  BarChart3,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { getNango, PROVIDER_MAP } from '@/lib/nango';
import Nango from '@nangohq/frontend';

// Professional icon mapping (no emojis)
const PROVIDER_ICONS: Record<string, React.ComponentType<any>> = {
  'google': Mail,
  'hubspot': BarChart3,
  'notion': FileText,
  'shopify': ShoppingCart,
  'slack': MessageSquare,
};

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface Integration {
  id: string;
  provider_id: string;
  status: 'pending' | 'connected' | 'error' | 'revoked';
  account_info: { email?: string; connection_id?: string };
  last_sync_at: string | null;
  error_message: string | null;
}

// Disabled providers (not configured in Nango yet)
const DISABLED_PROVIDERS = ['microsoft365', 'quickbooks', 'zendesk'];

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersRes, integrationsRes] = await Promise.all([
        fetch('/api/integrations/providers'),
        fetch(`/api/integrations?tenant_id=${TENANT_ID}`),
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        // Filter out disabled providers
        const enabledProviders = (data.providers || []).filter(
          (p: Provider) => !DISABLED_PROVIDERS.includes(p.id)
        );
        setProviders(enabledProviders);
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
      setError('Failed to load integrations');
    }
    setLoading(false);
  };

  const connectProvider = async (providerId: string) => {
    setConnecting(providerId);
    setError(null);

    const nangoIntegrationId = PROVIDER_MAP[providerId];
    
    if (!nangoIntegrationId) {
      setError(`Provider ${providerId} is not configured`);
      setConnecting(null);
      return;
    }

    try {
      // 1. Get session token from backend
      const response = await fetch('/api/integrations/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantId: TENANT_ID,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create Nango session');
      }

      const { sessionToken } = await response.json();

      // 2. Open Nango Connect UI with the session token
      const nangoUrl = `https://connect.nango.dev/?session_token=${sessionToken}`;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        nangoUrl,
        'nango-connect',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // 3. Poll for connection completion (simplified for this UI)
      const pollInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollInterval);
          await loadData();
          setConnecting(null);
        }
      }, 2000);

    } catch (err: any) {
      console.error('Nango connection error:', err);
      setError(err.message || 'Failed to connect. Please try again.');
      setConnecting(null);
    }
  };

  const simulatedConnect = async (providerId: string) => {
    try {
      await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          user_id: TENANT_ID,
          provider_id: providerId,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const disconnectProvider = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const getIntegration = (providerId: string) =>
    integrations.find((i) => i.provider_id === providerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Connect Your Tools</h1>
          <p className="text-slate-500 mt-1">
            Link your business systems so Eve can access your data and help you work smarter
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" strokeWidth={1.5} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Status Banner */}
        {connectedCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {connectedCount} tool{connectedCount !== 1 ? 's' : ''} connected
              </p>
              <p className="text-xs text-emerald-600">
                Eve can now access data from these systems to help you
              </p>
            </div>
          </div>
        )}

        {/* Benefits */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-slate-600 tracking-wide uppercase">
              What happens when you connect?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-slate-100">
                  <Shield className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Secure Access</h4>
                  <p className="text-xs text-slate-500 mt-1">OAuth 2.0 — we never see your password</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-slate-100">
                  <RefreshCw className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Auto-Sync</h4>
                  <p className="text-xs text-slate-500 mt-1">Data stays fresh automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-slate-100">
                  <Zap className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-800">Smart Answers</h4>
                  <p className="text-xs text-slate-500 mt-1">Ask questions across all your tools</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Providers Grid */}
        <div className="grid grid-cols-2 gap-4">
          {providers.map((provider) => {
            const integration = getIntegration(provider.id);
            const isConnected = integration?.status === 'connected';
            const isConnecting = connecting === provider.id;
            const Icon = PROVIDER_ICONS[provider.id] || FileText;

            return (
              <Card 
                key={provider.id} 
                className={`border-slate-200 shadow-sm transition-all ${
                  isConnected ? 'border-emerald-200 bg-emerald-50/30' : 'hover:border-slate-300'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${isConnected ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <Icon className={`h-5 w-5 ${isConnected ? 'text-emerald-600' : 'text-slate-600'}`} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">{provider.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                        <Badge 
                          variant="outline" 
                          className="mt-2 text-xs font-normal border-slate-200 text-slate-500"
                        >
                          {provider.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isConnected ? (
                        <>
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                            <Check className="h-3 w-3 mr-1" strokeWidth={2} />
                            Connected
                          </Badge>
                          <button
                            onClick={() => disconnectProvider(integration!.id)}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => connectProvider(provider.id)} 
                          disabled={isConnecting}
                          size="sm"
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs"
                        >
                          {isConnecting ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" strokeWidth={2} />
                              Connecting
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isConnected && integration?.account_info?.email && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      Connected as: <span className="font-medium text-slate-600">{integration.account_info.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
