'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
}

interface ChatInterfaceProps {
    tenantId: string;
}

export function ChatInterface({ tenantId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your research assistant. Ask me anything about your uploaded documents.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg.content,
                    tenant_id: tenantId,
                    history: [] // We could pass previous messages here for context
                })
            });

            if (!res.ok) throw new Error("Failed to fetch response");

            const data = await res.json();

            const botMsg: Message = {
                role: 'assistant',
                content: data.answer,
                citations: data.citations
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error retrieving that information.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Research Assistant
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "flex gap-3 max-w-[80%]",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    msg.role === 'user' ? "bg-blue-600" : "bg-muted"
                                )}>
                                    {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5" />}
                                </div>

                                <div className="space-y-2">
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-blue-600 text-white rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {/* Citations */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.citations.map((cite, i) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-100">
                                                    <FileText className="h-3 w-3" />
                                                    {cite}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex w-full justify-start">
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your documents..."
                            className="flex-1"
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
