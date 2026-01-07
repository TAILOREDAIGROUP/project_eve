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
import { Play, X, Sparkles } from 'lucide-react';

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

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-xl">{taskIcon}</span>
            {taskTitle}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length > 0 ? (
          <>
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={fieldValues[field.name]}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={fieldValues[field.name]}
                    onValueChange={(v) => setFieldValues({ ...fieldValues, [field.name]: v })}
                  >
                    <SelectTrigger>
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
                  />
                )}
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Run Task
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              This task is ready to run as-is
            </p>
            <Button onClick={() => onSubmit(promptTemplate, {})}>
              <Play className="h-4 w-4 mr-2" />
              Run Task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
