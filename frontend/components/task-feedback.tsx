'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface TaskFeedbackProps {
  taskExecutionId: string;
  onFeedback: (feedback: 'positive' | 'negative') => Promise<void>;
}

export function TaskFeedback({ taskExecutionId, onFeedback }: TaskFeedbackProps) {
  const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    setLoading(true);
    try {
      await onFeedback(feedback);
      setSubmitted(feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-500" />
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('positive')}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('negative')}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
