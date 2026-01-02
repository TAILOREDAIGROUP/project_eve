import React from 'react';
import { LayoutDashboard, Database, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/40 hidden md:block shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">Central Intel</h1>
                </div>
                <nav className="space-y-1 px-4">
                    <Link href="/dashboard" className="flex items-center gap-3 rounded-lg hover:bg-muted px-3 py-2 text-foreground font-medium transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/data-sources" className="flex items-center gap-3 rounded-lg hover:bg-muted px-3 py-2 text-foreground font-medium transition-colors">
                        <Database className="h-5 w-5" />
                        Data Sources
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg hover:bg-muted px-3 py-2 text-foreground font-medium transition-colors">
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                {children}
            </main>
        </div>
    );
}
