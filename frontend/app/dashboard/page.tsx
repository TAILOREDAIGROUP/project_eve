'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, X } from 'lucide-react';
import { QuickActions } from '@/components/quick-actions';
import { DepartmentCard } from '@/components/department-card';
import { SmartTaskForm } from '@/components/smart-task-form';
import { TaskResultActions } from '@/components/task-result-actions';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { useOnboarding } from '@/hooks/use-onboarding';
import { DEPARTMENTS, Department } from '@/lib/department-tasks';

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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'What are we tackling next?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isComplete: onboardingComplete, isLoading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    if (!onboardingLoading && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [onboardingLoading, onboardingComplete]);

  useEffect(() => {
    // Load custom departments
    async function loadDepartments() {
      try {
        const res = await fetch(`/api/admin/prompts?tenant_id=${TENANT_ID}`);
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string, taskType?: string) => {
    if (!content.trim() || isLoading) return;

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
          tenant_id: TENANT_ID,
          session_id: `session-${TENANT_ID}`,
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
      // Send directly
      sendMessage(prompt, title);
    }
  };

  const handleSmartFormSubmit = (filledPrompt: string, fieldValues: Record<string, string>) => {
    sendMessage(filledPrompt, activeTask?.title);
  };

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    try {
      await fetch('/api/actions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <OnboardingWizard open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        {/* Quick Actions */}
        <QuickActions onRunTask={(prompt) => handleRunTask(prompt)} />

        {/* Smart Task Form (when active) */}
        {activeTask && (
          <SmartTaskForm
            taskTitle={activeTask.title}
            taskIcon={activeTask.icon}
            promptTemplate={activeTask.prompt}
            onSubmit={handleSmartFormSubmit}
            onCancel={() => setActiveTask(null)}
          />
        )}

        {/* Chat Card */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Chat with Eve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="h-[300px] overflow-y-auto mb-4 space-y-4 pr-2">
              {messages.map((message, index) => (
                <div key={index}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  {message.role === 'assistant' && message.showActions && message.content && (
                    <div className="ml-4 mt-2">
                      <TaskResultActions
                        content={message.content}
                        taskType={message.taskType}
                        onFeedback={handleFeedback}
                        onRegenerate={() => {
                          const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                          if (lastUserMessage) {
                            sendMessage(lastUserMessage.content, lastUserMessage.taskType);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Eve anything or describe what you need help with..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Department Cards */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">🏢 Department Quick Tasks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
    </>
  );
}
