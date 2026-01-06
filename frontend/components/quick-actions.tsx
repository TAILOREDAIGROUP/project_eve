'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, X, Edit2, Check } from 'lucide-react';
import { TaskPrompt, DEFAULT_QUICK_ACTIONS, DEPARTMENTS } from '@/lib/department-tasks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface QuickActionsProps {
  onRunTask: (prompt: string) => void;
}

export function QuickActions({ onRunTask }: QuickActionsProps) {
  const [actions, setActions] = useState<TaskPrompt[]>(DEFAULT_QUICK_ACTIONS);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAction, setNewAction] = useState({ title: '', icon: '⚡', prompt: '' });

  // Load saved actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('eve-quick-actions');
    if (saved) {
      try {
        setActions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load quick actions:', e);
      }
    }
  }, []);

  // Save actions to localStorage
  const saveActions = (newActions: TaskPrompt[]) => {
    setActions(newActions);
    localStorage.setItem('eve-quick-actions', JSON.stringify(newActions));
  };

  const addAction = () => {
    if (!newAction.title || !newAction.prompt) return;
    
    const action: TaskPrompt = {
      id: `custom-${Date.now()}`,
      title: newAction.title,
      icon: newAction.icon || '⚡',
      prompt: newAction.prompt,
      category: 'custom',
    };
    
    saveActions([...actions, action]);
    setNewAction({ title: '', icon: '⚡', prompt: '' });
    setShowAddDialog(false);
  };

  const removeAction = (id: string) => {
    saveActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">⭐ My Quick Actions</h2>
        <div className="flex gap-2">
           <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Action
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Action</DialogTitle>
                <DialogDescription>
                  Create a shortcut for a prompt you use frequently.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Name</label>
                  <Input 
                    placeholder="e.g., Weekly Report" 
                    value={newAction.title}
                    onChange={(e) => setNewAction({...newAction, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prompt Text</label>
                  <Textarea 
                    placeholder="Describe exactly what Eve should do..." 
                    value={newAction.prompt}
                    onChange={(e) => setNewAction({...newAction, prompt: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={addAction}>Add shortcut</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 text-xs"
          >
            {isEditing ? <Check className="h-3 w-3 mr-1" /> : <Edit2 className="h-3 w-3 mr-1" />}
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Card 
            key={action.id}
            className={`cursor-pointer transition-all ${isEditing ? 'border-dashed' : 'hover:shadow-md hover:scale-[1.02]'}`}
            onClick={() => !isEditing && onRunTask(action.prompt)}
          >
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg shrink-0">{action.icon}</span>
                <span className="text-sm font-medium truncate">{action.title}</span>
              </div>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 shrink-0"
                  onClick={(e) => { e.stopPropagation(); removeAction(action.id); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
