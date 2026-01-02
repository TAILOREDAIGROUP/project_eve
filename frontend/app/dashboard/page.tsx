'use client';

import React, { useState } from 'react';
import { DataUploader } from '@/components/data-uploader';
import { KnowledgeBase } from '@/components/knowledge-base';
import { ChatInterface } from '@/components/chat-interface';
import { KnowledgeGraph } from '@/components/knowledge-graph';
import { UsageMeter } from '@/components/usage-meter';
import { QuickActions } from '@/components/quick-actions';
import { LayoutDashboard, Database, Settings } from 'lucide-react';

export default function DashboardPage() {
    // Hardcoded Tenant ID for Phase 2 demo
    const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [chatTrigger, setChatTrigger] = useState<string | null>(null);

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleQuickAction = (prompt: string) => {
        setChatTrigger(prompt);
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/40 hidden md:block">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">Central Intel</h1>
                </div>
                <nav className="space-y-1 px-4">
                    <a href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary font-medium">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted font-medium">
                        <Database className="h-5 w-5" />
                        Data Sources
                    </a>
                    <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted font-medium">
                        <Settings className="h-5 w-5" />
                        Settings
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* Top Row: Graph (Left/Center) & Usage (Right) */}
                    <div className="col-span-2 lg:col-span-2">
                        <KnowledgeGraph tenantId={TENANT_ID} />
                    </div>
                    <div className="col-span-2 lg:col-span-1 space-y-4">
                        <UsageMeter tenantId={TENANT_ID} />
                        <DataUploader tenantId={TENANT_ID} onUploadComplete={handleUploadComplete} />
                    </div>

                    {/* Middle Row: Content List */}
                    <div className="col-span-2 lg:col-span-3">
                        <KnowledgeBase tenantId={TENANT_ID} />
                    </div>

                    {/* Bottom Row: Chat */}
                    <div className="col-span-2 lg:col-span-3 flex flex-col gap-6">
                        <QuickActions onAction={handleQuickAction} />
                        <ChatInterface tenantId={TENANT_ID} externalTrigger={chatTrigger} />
                    </div>
                </div>
            </main>
        </div>
    );
}
