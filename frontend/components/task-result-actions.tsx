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
    <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
      {/* Primary Actions */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCopy}
        className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" strokeWidth={2.5} />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Copy
          </>
        )}
      </Button>

      {taskType?.toLowerCase().includes('email') && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSendEmail}
          className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium"
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
          Email
        </Button>
      )}

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCreateDoc}
        className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium"
      >
        <Download className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
        Save
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-slate-200 shadow-lg">
          <DropdownMenuItem onClick={onRegenerate} className="text-slate-600 focus:text-slate-900 focus:bg-slate-50">
            <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Regenerate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateDoc} className="text-slate-600 focus:text-slate-900 focus:bg-slate-50">
            <FileText className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem className="text-slate-600 focus:text-slate-900 focus:bg-slate-50">
            <Calendar className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Schedule Follow-up
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem className="text-slate-600 focus:text-slate-900 focus:bg-slate-50">
            <Share className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Share Output
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feedback */}
      <div className="flex-1" />
      
      {feedbackGiven ? (
        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          <Check className="h-3 w-3 mr-1" strokeWidth={2.5} />
          Feedback received
        </Badge>
      ) : (
        <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-0.5 border border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            onClick={() => handleFeedback('positive')}
          >
            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
            onClick={() => handleFeedback('negative')}
          >
            <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}
