'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Play, 
  X, 
  Sparkles,
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

interface SmartTaskFormProps {
  taskTitle: string;
  taskIcon: string;
  promptTemplate: string;
  onSubmit: (filledPrompt: string, fieldValues: Record<string, string>) => void;
  onCancel: () => void;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder: string;
  options?: string[];
}

export function SmartTaskForm({
  taskTitle,
  taskIcon,
  promptTemplate,
  onSubmit,
  onCancel,
}: SmartTaskFormProps) {
  // Parse bracket fields from prompt template
  const fields = useMemo(() => {
    const bracketRegex = /\[([^\]]+)\]/g;
    const matches = [...promptTemplate.matchAll(bracketRegex)];
    const uniqueFields = [...new Set(matches.map(m => m[1]))];
    
    return uniqueFields.map((field): FieldConfig => {
      const lowerField = field.toLowerCase();
      
      if (lowerField.includes('describe') || lowerField.includes('details') || lowerField.includes('context')) {
        return {
          name: field,
          label: formatLabel(field),
          type: 'textarea',
          placeholder: `Enter ${formatLabel(field).toLowerCase()}...`,
        };
      }
      
      if (lowerField.includes('tone') || lowerField.includes('style')) {
        return {
          name: field,
          label: formatLabel(field),
          type: 'select',
          placeholder: 'Select...',
          options: ['Professional', 'Friendly', 'Formal', 'Casual', 'Urgent'],
        };
      }
      
      if (lowerField.includes('priority')) {
        return {
          name: field,
          label: formatLabel(field),
          type: 'select',
          placeholder: 'Select...',
          options: ['Low', 'Medium', 'High', 'Critical'],
        };
      }
      
      if (lowerField.includes('platform')) {
        return {
          name: field,
          label: formatLabel(field),
          type: 'select',
          placeholder: 'Select...',
          options: ['LinkedIn', 'Twitter/X', 'Facebook', 'Instagram', 'Email'],
        };
      }
      
      return {
        name: field,
        label: formatLabel(field),
        type: 'text',
        placeholder: `Enter ${formatLabel(field).toLowerCase()}...`,
      };
    });
  }, [promptTemplate]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach(f => { initial[f.name] = ''; });
    return initial;
  });

  const formatLabel = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  };

  const handleSubmit = () => {
    let filledPrompt = promptTemplate;
    Object.entries(fieldValues).forEach(([key, value]) => {
      filledPrompt = filledPrompt.replace(new RegExp(`\\[${key}\\]`, 'g'), value || `[${key}]`);
    });
    onSubmit(filledPrompt, fieldValues);
  };

  const isValid = fields.every(f => fieldValues[f.name]?.trim());

  const Icon = ICON_MAP[taskIcon] || FileText;

  return (
    <Card className="border-slate-200 shadow-md overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white border border-slate-200 shadow-sm">
              <Icon className="h-5 w-5 text-slate-700" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {taskTitle}
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Configure Smart Task</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {fields.length > 0 ? (
          <>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                    {field.label}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={fieldValues[field.name]}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      rows={3}
                      className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 resize-none"
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={fieldValues[field.name]}
                      onValueChange={(v) => setFieldValues({ ...fieldValues, [field.name]: v })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-slate-400 focus:ring-slate-400">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      value={fieldValues[field.name]}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      className="border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSubmit} 
                disabled={!isValid} 
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Play className="h-4 w-4 mr-2" strokeWidth={2} />
                Run Task
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-600 mb-6 max-w-[200px] mx-auto">
              This task is ready to execute with default settings.
            </p>
            <Button 
              onClick={() => onSubmit(promptTemplate, {})}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Play className="h-4 w-4 mr-2" strokeWidth={2} />
              Run Task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
