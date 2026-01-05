'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat-interface';
import { QuickActions } from '@/components/quick-actions';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

export default function DashboardPage() {
    const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";

    // Restore the missing state logic
    const [chatTrigger, setChatTrigger] = useState<string | null>(null);

    const handleQuickAction = (prompt: string) => {
        setChatTrigger(prompt);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8 max-w-5xl mx-auto w-full">
            <div className="mb-8 text-center space-y-2 relative">
                <div className="absolute right-0 top-0">
                    <Link href="/dashboard/intelligence">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            View Intelligence Dashboard
                        </Button>
                    </Link>
                </div>
                <h1 className="text-4xl font-bold">Welcome to EVE.</h1>
                <p className="text-muted-foreground">What are we doing today?</p>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex-none">
                    <QuickActions onAction={handleQuickAction} />
                </div>

                <div className="flex-1 min-h-0">
                    <ChatInterface tenantId={TENANT_ID} externalTrigger={chatTrigger} />
                </div>
            </div>
        </div>
    );
}
