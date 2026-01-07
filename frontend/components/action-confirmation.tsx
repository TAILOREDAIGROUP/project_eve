'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Send, 
  FileText, 
  Calendar, 
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Shield
} from 'lucide-react';

export interface ProposedAction {
  id: string;
  type: 'send_email' | 'create_deal' | 'create_ticket' | 'create_task' | 'update_record' | 'post_message';
  provider: string;
  title: string;
  description: string;
  details: Record<string, string>;
  risk_level: 'low' | 'medium' | 'high';
}

interface ActionConfirmationProps {
  open: boolean;
  onClose: () => void;
  actions: ProposedAction[];
  onConfirm: (selectedActionIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export function ActionConfirmation({
  open,
  onClose,
  actions,
  onConfirm,
  onCancel,
}: ActionConfirmationProps) {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(actions.map(a => a.id))
  );
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<Record<string, 'success' | 'error' | null>>({});

  const toggleAction = (actionId: string) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(actionId)) {
      newSelected.delete(actionId);
    } else {
      newSelected.add(actionId);
    }
    setSelectedActions(newSelected);
  };

  const handleConfirm = async () => {
    setExecuting(true);
    try {
      await onConfirm(Array.from(selectedActions));
      // Mark all as success for now
      const newResults: Record<string, 'success' | 'error' | null> = {};
      selectedActions.forEach(id => {
        newResults[id] = 'success';
      });
      setResults(newResults);
    } catch (error) {
      // Mark all as error
      const newResults: Record<string, 'success' | 'error' | null> = {};
      selectedActions.forEach(id => {
        newResults[id] = 'error';
      });
      setResults(newResults);
    }
    setExecuting(false);
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      google: '🔵',
      slack: '💬',
      hubspot: '🟠',
      quickbooks: '💚',
      zendesk: '🎫',
    };
    return icons[provider] || '📦';
  };

  const hasResults = Object.keys(results).length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasResults ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Actions Completed
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-purple-500" />
                Confirm Actions
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasResults
              ? 'Here are the results of the executed actions.'
              : 'Eve wants to perform the following actions. Review and approve.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4 max-h-[400px] overflow-y-auto">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`p-4 rounded-lg border ${
                selectedActions.has(action.id) ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'
              } ${results[action.id] === 'success' ? 'border-green-300 bg-green-50/50' : ''} 
              ${results[action.id] === 'error' ? 'border-red-300 bg-red-50/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!hasResults && (
                  <Checkbox
                    checked={selectedActions.has(action.id)}
                    onCheckedChange={() => toggleAction(action.id)}
                    disabled={executing}
                  />
                )}
                
                {hasResults && (
                  <div className="mt-1">
                    {results[action.id] === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : results[action.id] === 'error' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getProviderIcon(action.provider)}</span>
                    {getActionIcon(action.type)}
                    <span className="font-medium">{action.title}</span>
                    <Badge className={`text-xs ${getRiskColor(action.risk_level)}`}>
                      {action.risk_level} risk
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                  
                  {Object.keys(action.details).length > 0 && (
                    <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                      {Object.entries(action.details).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium w-24">{key}:</span>
                          <span className="text-muted-foreground truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!hasResults && actions.some(a => a.risk_level === 'high') && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800">
              Some actions are marked as high risk. Please review carefully before confirming.
            </span>
          </div>
        )}

        <DialogFooter>
          {hasResults ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel} disabled={executing}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={executing || selectedActions.size === 0}
              >
                {executing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
