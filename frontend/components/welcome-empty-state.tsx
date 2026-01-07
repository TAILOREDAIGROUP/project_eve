'use client';

import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Brain,
  ArrowRight,
  Zap
} from 'lucide-react';

interface WelcomeEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tips?: string[];
}

export function WelcomeEmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  tips,
}: WelcomeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
        {icon || <Sparkles className="h-8 w-8 text-white" />}
      </div>
      
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      
      {tips && tips.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 max-w-md mb-6 text-left">
          <h3 className="font-medium mb-2 text-sm">Quick tips:</h3>
          <ul className="space-y-2">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(actionLabel && (actionHref || onAction)) && (
        <Button onClick={onAction} asChild={!!actionHref}>
          {actionHref ? (
            <a href={actionHref}>
              {actionLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          ) : (
            <>
              {actionLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
