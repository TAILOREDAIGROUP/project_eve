'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

interface ChatErrorFallbackProps {
  error?: Error | null;
  onRetry: () => void;
}

export function ChatErrorFallback({ error, onRetry }: ChatErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-4 mb-4">
        <MessageSquare className="w-12 h-12 text-amber-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Chat Temporarily Unavailable
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
        We're having trouble connecting to the AI assistant. Your conversation history is safe.
      </p>

      {error?.message && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-4">
          <AlertTriangle className="w-4 h-4" />
          <span>{error.message}</span>
        </div>
      )}

      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Reconnecting...' : 'Reconnect'}
      </button>

      <p className="text-xs text-gray-400 mt-6">
        If this continues, try refreshing the page or check your internet connection.
      </p>
    </div>
  );
}
