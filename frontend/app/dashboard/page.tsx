'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';
import { QuickActions } from '@/components/quick-actions';
import { DepartmentCard } from '@/components/department-card';
import { DEPARTMENTS } from '@/lib/department-tasks';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'What are we tackling next?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
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

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

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
              setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
            } catch (e) {
              // Handle non-JSON content or malformed lines
              const match = line.match(/0:"([^"]*)"/);
              if (match) {
                assistantContent += match[1];
                setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
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

  const handleRunTask = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
    // Optionally auto-send:
    // sendMessage(prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Quick Actions - Customizable */}
      <QuickActions onRunTask={handleRunTask} />

      {/* Chat Card */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Chat with Eve
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-purple-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-purple-500/50 rounded-full animate-bounce"></span>
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
              className="flex-1 h-11"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="h-11 px-5">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Department Cards */}
      <div className="pt-2">
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
           🏢 Department Quick Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard 
              key={dept.id} 
              department={dept} 
              onRunTask={handleRunTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
