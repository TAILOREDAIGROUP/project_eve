'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, X, RefreshCw, ChevronRight } from 'lucide-react';
import { QuickActions } from '@/components/quick-actions';
import { DepartmentCard } from '@/components/department-card';
import { SmartTaskForm } from '@/components/smart-task-form';
import { TaskResultActions } from '@/components/task-result-actions';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { useOnboarding } from '@/hooks/use-onboarding';
import { DEPARTMENTS, Department } from '@/lib/department-tasks';
import { useAuth } from '@clerk/nextjs';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatErrorFallback } from '@/components/chat-error-fallback';
import { ChatSkeleton } from '@/components/skeleton-loaders';
import { ChatInterface } from '@/components/chat-interface';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  taskType?: string;
  showActions?: boolean;
}

interface ActiveTask {
  title: string;
  icon: string;
  prompt: string;
}

export default function Dashboard() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'What are we tackling next?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [externalTrigger, setExternalTrigger] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isComplete: onboardingComplete, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!onboardingLoading && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [onboardingLoading, onboardingComplete]);

  useEffect(() => {
    // Load custom departments
    async function loadDepartments() {
      if (!userId) return;
      try {
        const res = await fetch('/api/admin/prompts');
        if (res.ok) {
          const data = await res.json();
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          }
        }
      } catch (error) {
        console.error('Failed to load custom departments:', error);
      }
    }
    loadDepartments();
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string, taskType?: string) => {
    if (!content.trim() || isLoading || !userId) return;

    const userMessage: Message = { role: 'user', content, taskType };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setActiveTask(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          session_id: `session-${userId}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages([...newMessages, { role: 'assistant', content: '', taskType, showActions: true }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const content = JSON.parse(line.slice(2));
              assistantContent += content;
              setMessages([...newMessages, { role: 'assistant', content: assistantContent, taskType, showActions: true }]);
            } catch (e) {
              const match = line.match(/0:"([^"]*)"/);
              if (match) {
                assistantContent += match[1];
                setMessages([...newMessages, { role: 'assistant', content: assistantContent, taskType, showActions: true }]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleRunTask = (prompt: string, title?: string, icon?: string) => {
    // Check if prompt has bracket fields
    const hasBrackets = /\[[^\]]+\]/.test(prompt);
    
    if (hasBrackets && title && icon) {
      // Show smart form
      setActiveTask({ title, icon, prompt });
    } else {
      // Send directly via ChatInterface trigger
      setExternalTrigger(prompt);
      // Also scroll to chat
      document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSmartFormSubmit = (filledPrompt: string, fieldValues: Record<string, string>) => {
    setExternalTrigger(filledPrompt);
    setActiveTask(null);
    document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (!userId) return;
    try {
      await fetch('/api/actions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
        }),
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  if (onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('[Dashboard] Global error:', error);
      }}
    >
      <div className="min-h-screen bg-slate-50/50">
        <OnboardingWizard open={showOnboarding} onComplete={handleOnboardingComplete} />
        
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Quick Actions */}
          <QuickActions onRunTask={(prompt) => handleRunTask(prompt)} />

          {/* Smart Task Form (when active) */}
          {activeTask && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <SmartTaskForm
                taskTitle={activeTask.title}
                taskIcon={activeTask.icon}
                promptTemplate={activeTask.prompt}
                onSubmit={handleSmartFormSubmit}
                onCancel={() => setActiveTask(null)}
              />
            </div>
          )}

          {/* Chat Section */}
          <div id="chat-section">
            <ErrorBoundary
              fallback={
                <ChatErrorFallback
                  onRetry={() => window.location.reload()}
                />
              }
              onError={(error) => {
                console.error('[Dashboard] Chat error:', error);
              }}
            >
              <Suspense fallback={<ChatSkeleton />}>
                <ChatInterface 
                  tenantId={userId || 'anonymous'} 
                  externalTrigger={externalTrigger} 
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Department Quick Tasks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
            <h2 className="text-sm font-medium text-slate-600 tracking-wide uppercase">Department Quick Tasks</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <DepartmentCard 
                key={dept.id} 
                department={dept} 
                onRunTask={(prompt) => {
                  const task = dept.tasks.find(t => t.prompt === prompt);
                  handleRunTask(prompt, task?.title, task?.icon);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </ErrorBoundary>
  );
}
