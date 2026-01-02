'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, FileText, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
}

interface ChatInterfaceProps {
    tenantId: string;
    externalTrigger?: string | null;
}

const PRESET_PROMPTS = [
    "What is the maximum daily meal allowance?",
    "Does this policy cover international travel insurance?",
    "List all reimbursable expenses mentioned.",
    "Draft a rejection email for this receipt based on the policy."
];

export function ChatInterface({ tenantId, externalTrigger }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your research assistant. Ask me anything about your uploaded documents.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasTriggeredRef = useRef<string | null>(null);

    // Watch for external trigger (QuickActions)
    useEffect(() => {
        if (externalTrigger && externalTrigger !== hasTriggeredRef.current) {
            hasTriggeredRef.current = externalTrigger;
            handleSend(externalTrigger);
        }
    }, [externalTrigger]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;

        if (!textToSend.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Updated to relative path
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg], // Send history + new message
                    tenant_id: tenantId
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to fetch response");
            }

            // Stream Handling
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let botContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                botContent += chunk;

                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    lastMsg.content = botContent;
                    return newMsgs;
                });
            }

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Something went wrong.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col bg-slate-50 border-slate-200 shadow-md">
            <CardHeader className="px-6 py-4 border-b bg-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Bot className="h-5 w-5 text-indigo-600" />
                    AI Research Assistant
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col relative">
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
                                "flex gap-3 max-w-[85%]",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                    msg.role === 'user' ? "bg-indigo-600" : "bg-white border border-slate-200"
                                )}>
                                    {msg.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-indigo-600" />}
                                </div>

                                <div className="space-y-2">
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
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
                        <div className="flex w-full justify-start animate-pulse">
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none flex items-center gap-2 border border-slate-100">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                    <span className="text-sm text-slate-500">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-white">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2 relative"
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                                    <Zap className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[300px]">
                                {PRESET_PROMPTS.map((prompt, i) => (
                                    <DropdownMenuItem key={i} onClick={() => setInput(prompt)}>
                                        {prompt}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your documents..."
                            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
