'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  Mail,
  FileText,
  Calendar,
  Check,
  MoreHorizontal,
  Download,
  Share,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface TaskResultActionsProps {
  content: string;
  taskType?: string;
  onFeedback?: (feedback: 'positive' | 'negative') => void;
  onRegenerate?: () => void;
}

export function TaskResultActions({
  content,
  taskType,
  onFeedback,
  onRegenerate,
}: TaskResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    setFeedbackGiven(feedback);
    onFeedback?.(feedback);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('');
    const body = encodeURIComponent(content);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCreateDoc = () => {
    // Create a downloadable text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eve-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
      {/* Primary Actions */}
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </>
        )}
      </Button>

      {taskType?.includes('email') && (
        <Button variant="outline" size="sm" onClick={handleSendEmail}>
          <Mail className="h-4 w-4 mr-1" />
          Open in Email
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={handleCreateDoc}>
        <Download className="h-4 w-4 mr-1" />
        Save
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateDoc}>
            <FileText className="h-4 w-4 mr-2" />
            Save as Document
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="h-4 w-4 mr-2" />
            Create Follow-up Task
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Share className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feedback */}
      <div className="flex-1" />
      
      {feedbackGiven ? (
        <Badge variant="outline" className="text-green-600">
          <Check className="h-3 w-3 mr-1" />
          Thanks for feedback!
        </Badge>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={() => handleFeedback('positive')}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={() => handleFeedback('negative')}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
