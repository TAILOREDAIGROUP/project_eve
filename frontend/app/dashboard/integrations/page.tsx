'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Zap,
  AlertCircle
} from 'lucide-react';

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
  account_info: { email?: string; name?: string };
  last_sync_at: string | null;
  error_message: string | null;
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providersRes, integrationsRes] = await Promise.all([
        fetch('/api/integrations/providers'),
        fetch(`/api/integrations?tenant_id=${TENANT_ID}`),
      ]);

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers || []);
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
    setLoading(false);
  };

  const connectProvider = async (providerId: string) => {
    setConnecting(providerId);
    
    // In production, this would redirect to OAuth flow
    // For now, simulate a connection
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          user_id: TENANT_ID,
          provider_id: providerId,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
    
    setConnecting(null);
  };

  const disconnectProvider = async (integrationId: string) => {
    try {
      await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getIntegration = (providerId: string) => 
    integrations.find(i => i.provider_id === providerId);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-100 text-blue-800';
      case 'communication': return 'bg-purple-100 text-purple-800';
      case 'crm': return 'bg-orange-100 text-orange-800';
      case 'finance': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Connect Your Tools</h1>
        <p className="text-muted-foreground mt-1">
          Link your business systems so Eve can access your data and help you work smarter
        </p>
      </div>

      {/* Status Banner */}
      <Card className={connectedCount > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {connectedCount > 0 ? (
              <>
                <Zap className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {connectedCount} tool{connectedCount !== 1 ? 's' : ''} connected
                  </p>
                  <p className="text-sm text-green-600">
                    Eve can now access data from these systems to help you
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">No tools connected yet</p>
                  <p className="text-sm text-amber-600">
                    Connect at least one tool to unlock Eve's full potential
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What Eve Can Do */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What happens when you connect?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Secure Access</h4>
                <p className="text-xs text-muted-foreground">Your credentials are encrypted. You control what Eve can see.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Auto-Sync</h4>
                <p className="text-xs text-muted-foreground">Eve stays up to date with your latest data automatically.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Smart Answers</h4>
                <p className="text-xs text-muted-foreground">Ask questions across all your tools in one place.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const integration = getIntegration(provider.id);
          const isConnected = integration?.status === 'connected';
          const isConnecting = connecting === provider.id;

          return (
            <Card key={provider.id} className={isConnected ? 'border-green-200' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{provider.icon}</span>
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                      <Badge className={`mt-1 text-xs ${getCategoryColor(provider.category)}`}>
                        {provider.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {isConnected ? (
                      <>
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => disconnectProvider(integration!.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => connectProvider(provider.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {isConnected && integration?.account_info?.email && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    Connected as: {integration.account_info.email}
                    {integration.last_sync_at && (
                      <span className="ml-2">
                        • Last synced: {new Date(integration.last_sync_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {integration?.status === 'error' && (
                  <div className="mt-3 pt-3 border-t text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {integration.error_message || 'Connection error'}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
