'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WelcomeEmptyState } from '@/components/welcome-empty-state';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  FileText,
  Users,
  Calendar,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';

interface ActionLog {
  id: string;
  action_type: string;
  provider_id: string;
  task_id: string;
  status: 'pending' | 'confirmed' | 'executed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message: string | null;
  created_at: string;
  executed_at: string | null;
}

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'executed' | 'failed' | 'pending'>('all');

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/actions?tenant_id=${TENANT_ID}`);
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to load actions:', error);
      // Demo data
      setActions([
        {
          id: '1',
          action_type: 'send_email',
          provider_id: 'google',
          task_id: 'sm-1',
          status: 'executed',
          input_data: { to: 'client@example.com', subject: 'Follow-up on our conversation' },
          output_data: { message_id: 'msg_123' },
          error_message: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          executed_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: '2',
          action_type: 'create_deal',
          provider_id: 'hubspot',
          task_id: 'sm-2',
          status: 'executed',
          input_data: { name: 'Acme Corp Deal', amount: '5000' },
          output_data: { deal_id: 'deal_456' },
          error_message: null,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          executed_at: new Date(Date.now() - 7100000).toISOString(),
        },
        {
          id: '3',
          action_type: 'create_ticket',
          provider_id: 'zendesk',
          task_id: 'op-1',
          status: 'failed',
          input_data: { subject: 'Printer broken', priority: 'high' },
          output_data: {},
          error_message: 'API Authentication failed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          executed_at: null,
        }
      ]);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'confirmed': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Send className="h-4 w-4" />;
      case 'create_deal': return <Users className="h-4 w-4" />;
      case 'create_ticket': return <FileText className="h-4 w-4" />;
      case 'create_task': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    const icons: Record<string, string> = {
      google: '🔵',
      slack: '💬',
      hubspot: '🟠',
      quickbooks: '💚',
      zendesk: '🎫',
    };
    return (
      <Badge variant="outline" className="flex gap-1 items-center font-normal">
        <span>{icons[provider] || '📦'}</span>
        {provider}
      </Badge>
    );
  };

  const filteredActions = actions.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-purple-500" />
            Action History
          </h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all actions Eve has performed across your tools.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadActions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters & Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All Actions</TabsTrigger>
                <TabsTrigger value="executed">Executed</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActions.length > 0 ? (
            <div className="space-y-4">
              {filteredActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-full ${
                      action.status === 'executed' ? 'bg-green-100 text-green-600' :
                      action.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getActionIcon(action.action_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          {action.action_type.replace('_', ' ')}
                        </span>
                        {getStatusIcon(action.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(action.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getProviderBadge(action.provider_id)}
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {JSON.stringify(action.input_data).substring(0, 100)}...
                        </span>
                      </div>
                      {action.error_message && (
                        <p className="text-xs text-red-500 mt-2 bg-red-50 p-1.5 rounded border border-red-100 italic">
                          Error: {action.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="ghost" size="sm">View Details</Button>
                    <Badge variant={action.status === 'executed' ? 'default' : 'secondary'} className="capitalize">
                      {action.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <WelcomeEmptyState
              title="No actions found"
              description="Actions you approve will appear here once you've started working with Eve."
              icon={<History className="h-8 w-8 text-white" />}
              actionLabel="Go to Dashboard"
              actionHref="/dashboard"
              tips={[
                "Eve will ask for confirmation before performing write actions",
                "You can see a full audit trail here",
                "Successful, failed, and pending actions are all tracked"
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Success</p>
            <p className="text-2xl font-bold text-green-600">
              {actions.filter(a => a.status === 'executed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {actions.filter(a => a.status === 'failed').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">
              {actions.length > 0 
                ? Math.round((actions.filter(a => a.status === 'executed').length / actions.length) * 100) 
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
