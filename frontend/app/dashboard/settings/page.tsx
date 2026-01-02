'use client';

import React from 'react';
import { UsageMeter } from '@/components/usage-meter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
    const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage your account and API configuration.</p>
            </div>

            <div className="grid gap-8">
                {/* Usage Section */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Usage & Billing
                    </h3>
                    <div className="max-w-md">
                        <UsageMeter tenantId={TENANT_ID} />
                    </div>
                </section>

                {/* API Keys Placeholder */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Configuration
                    </h3>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Project Keys</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="key-name">OpenAI API Key (Stored in Env)</Label>
                                <div className="flex gap-2">
                                    <Input id="key-name" type="password" value="sk-........................" disabled className="bg-muted" />
                                    <Button variant="outline">Update</Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Managed via environment variables.</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
