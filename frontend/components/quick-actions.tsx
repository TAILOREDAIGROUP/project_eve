'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  GripVertical, 
  X, 
  Edit2, 
  Check,
  FileText,
  Mail,
  FileSearch,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Target,
  Type,
  Mails,
  Search,
  Megaphone,
  Presentation,
  BarChart3,
  Calculator,
  FileSpreadsheet,
  Layout,
  GitCompare,
  Receipt,
  Landmark,
  LineChart,
  Users,
  CheckSquare,
  BarChart,
  Book,
  GraduationCap,
  LogOut,
  Settings,
  Calendar,
  RefreshCw,
  ShoppingBag,
  List,
  AlertTriangle,
  Headphones,
  MessageCircle,
  HelpCircle,
  BarChart2,
  BookOpen,
  Package,
  Truck,
  RotateCcw,
  Factory
} from 'lucide-react';
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

// Map icon strings to Lucide components
const ICON_MAP: Record<string, any> = {
  'file-text': FileText,
  'mail': Mail,
  'file-search': FileSearch,
  'lightbulb': Lightbulb,
  'trending-up': TrendingUp,
  'message-square': MessageSquare,
  'target': Target,
  'type': Type,
  'mails': Mails,
  'search': Search,
  'megaphone': Megaphone,
  'presentation': Presentation,
  'bar-chart-3': BarChart3,
  'calculator': Calculator,
  'file-spreadsheet': FileSpreadsheet,
  'layout': Layout,
  'git-compare': GitCompare,
  'receipt': Receipt,
  'landmark': Landmark,
  'line-chart': LineChart,
  'users': Users,
  'check-square': CheckSquare,
  'bar-chart': BarChart,
  'book': Book,
  'graduation-cap': GraduationCap,
  'log-out': LogOut,
  'settings': Settings,
  'calendar': Calendar,
  'refresh-cw': RefreshCw,
  'shopping-bag': ShoppingBag,
  'list': List,
  'alert-triangle': AlertTriangle,
  'headphones': Headphones,
  'message-circle': MessageCircle,
  'help-circle': HelpCircle,
  'bar-chart-2': BarChart2,
  'book-open': BookOpen,
  'package': Package,
  'truck': Truck,
  'rotate-ccw': RotateCcw,
  'factory': Factory,
  'zap': Plus, // Fallback
};

interface QuickActionsProps {
  onRunTask: (prompt: string) => void;
}

export function QuickActions({ onRunTask }: QuickActionsProps) {
  const [actions, setActions] = useState<TaskPrompt[]>(DEFAULT_QUICK_ACTIONS);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAction, setNewAction] = useState({ title: '', icon: 'file-text', prompt: '' });

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
      icon: newAction.icon || 'file-text',
      prompt: newAction.prompt,
      category: 'custom',
    };
    
    saveActions([...actions, action]);
    setNewAction({ title: '', icon: 'file-text', prompt: '' });
    setShowAddDialog(false);
  };

  const removeAction = (id: string) => {
    saveActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
          <h2 className="text-sm font-medium text-slate-600 tracking-wide uppercase">My Quick Actions</h2>
        </div>
        <div className="flex gap-2">
           <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 hover:text-slate-900">
                <Plus className="h-3 w-3 mr-1" strokeWidth={1.5} />
                Add Action
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-slate-900 font-semibold">Add Custom Action</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Create a shortcut for a prompt you use frequently.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Action Name</label>
                  <Input 
                    placeholder="e.g., Weekly Report" 
                    value={newAction.title}
                    onChange={(e) => setNewAction({...newAction, title: e.target.value})}
                    className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Prompt Text</label>
                  <Textarea 
                    placeholder="Describe exactly what Eve should do..." 
                    value={newAction.prompt}
                    onChange={(e) => setNewAction({...newAction, prompt: e.target.value})}
                    className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</Button>
                <Button onClick={addAction} className="bg-slate-900 hover:bg-slate-800 text-white">Add shortcut</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 text-xs text-slate-500 hover:text-slate-900"
          >
            {isEditing ? <Check className="h-3 w-3 mr-1" strokeWidth={1.5} /> : <Edit2 className="h-3 w-3 mr-1" strokeWidth={1.5} />}
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon] || FileText;
          return (
            <button
              key={action.id}
              onClick={() => !isEditing && onRunTask(action.prompt)}
              className={`flex items-center justify-between p-4 bg-white border rounded-lg transition-all text-left group ${
                isEditing 
                  ? 'border-dashed border-slate-300 bg-slate-50/50' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-md bg-slate-100 group-hover:bg-slate-200 transition-colors shrink-0">
                  <Icon className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-slate-700 truncate">{action.title}</span>
              </div>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  onClick={(e) => { e.stopPropagation(); removeAction(action.id); }}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
