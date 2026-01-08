'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Play, 
  ChevronRight,
  TrendingUp,
  Mail,
  MessageSquare,
  Target,
  Type,
  Mails,
  Search,
  FileText,
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
  Factory,
  DollarSign
} from 'lucide-react';
import { Department, TaskPrompt } from '@/lib/department-tasks';

// Map icon strings to Lucide components
const ICON_MAP: Record<string, any> = {
  'trending-up': TrendingUp,
  'mail': Mail,
  'message-square': MessageSquare,
  'target': Target,
  'type': Type,
  'mails': Mails,
  'search': Search,
  'file-text': FileText,
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
  'dollar-sign': DollarSign,
};

interface DepartmentCardProps {
  department: Department;
  onRunTask: (prompt: string) => void;
}

export function DepartmentCard({ department, onRunTask }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const DeptIcon = ICON_MAP[department.icon] || Settings;

  if (isExpanded) {
    return (
      <Card className="col-span-full border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-slate-900 text-white">
                <DeptIcon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-xl text-slate-900">{department.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{department.description}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-900"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {department.tasks.map((task) => {
              const TaskIcon = ICON_MAP[task.icon] || FileText;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group cursor-pointer"
                  onClick={() => onRunTask(task.prompt)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-md bg-white border border-slate-100 group-hover:bg-slate-100 transition-colors shrink-0">
                      <TaskIcon className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">{task.title}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    <Play className="h-3 w-3 mr-1" strokeWidth={2} />
                    Run
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <button 
      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all text-left group"
      onClick={() => setIsExpanded(true)}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-md bg-slate-100 group-hover:bg-slate-200 transition-colors shrink-0">
          <DeptIcon className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
        </div>
        <div className="overflow-hidden">
          <h3 className="text-sm font-medium text-slate-800 truncate">{department.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{department.tasks.length} tasks</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" strokeWidth={1.5} />
    </button>
  );
}
