'use client';

import React, { useState } from 'react';
import { DataUploader } from '@/components/data-uploader';
import { KnowledgeBase } from '@/components/knowledge-base';
import { KnowledgeGraph } from '@/components/knowledge-graph';

export default function DataSourcesPage() {
    // Hardcoded Tenant ID for Phase 2 demo
    const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Data Sources</h2>
                    <p className="text-muted-foreground mt-1">Manage your documents and visualize connections.</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Top Row: Upload & List */}
                <div className="space-y-8">
                    <DataUploader tenantId={TENANT_ID} onUploadComplete={handleUploadComplete} />
                    <KnowledgeBase tenantId={TENANT_ID} />
                </div>

                {/* Right Column: Graph (Taller) */}
                <div className="h-full min-h-[500px]">
                    <KnowledgeGraph tenantId={TENANT_ID} />
                </div>
            </div>
        </div>
    );
}
