'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Activity } from 'lucide-react';

interface UsageStats {
    total_tokens: number;
    estimated_cost: number;
    total_requests: number;
}

interface UsageMeterProps {
    tenantId: string;
}

export function UsageMeter({ tenantId }: UsageMeterProps) {
    const [stats, setStats] = useState<UsageStats>({ total_tokens: 0, estimated_cost: 0, total_requests: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/usage/stats?tenant_id=${tenantId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchStats();
        // Poll every 5 seconds to show "Real-time" effect
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [tenantId]);

    const maxBudget = 5.00; // Demo budget $5
    const usagePercent = Math.min((stats.estimated_cost / maxBudget) * 100, 100);

    return (
        <Card className="bg-slate-900 text-white border-none shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Monthly Intelligence Cost</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full">
                        <Activity className="h-3 w-3" />
                        Live
                    </div>
                </div>

                <div className="mb-4">
                    <span className="text-3xl font-bold tracking-tight">${stats.estimated_cost.toFixed(4)}</span>
                    <span className="text-slate-500 ml-2 text-sm">/ ${maxBudget.toFixed(2)} limit</span>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>

                <div className="mt-4 flex justify-between text-xs text-slate-400">
                    <div>
                        <span className="block text-white font-semibold">{stats.total_tokens.toLocaleString()}</span>
                        <span>Tokens Generated</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-white font-semibold">{stats.total_requests}</span>
                        <span>API Calls</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
