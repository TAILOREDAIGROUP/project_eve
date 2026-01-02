'use client';

import React, { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { QuickActions } from '@/components/quick-actions';

export default function DashboardPage() {
    // Hardcoded Tenant ID for Phase 2 demo
    const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
    const [chatTrigger, setChatTrigger] = useState<string | null>(null);

    const handleQuickAction = (prompt: string) => {
        setChatTrigger(prompt);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-8 max-w-5xl mx-auto w-full">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Good Morning, Agent.</h1>
                <p className="text-lg text-slate-500">Ready to analyze the latest intelligence?</p>
            </div>

            <div className="flex-1 flex flex-col gap-8 min-h-0">
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
