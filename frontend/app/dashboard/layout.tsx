'use client';

import React from 'react';
import { 
  Database, 
  Settings, 
  Brain, 
  MessageSquare, 
  Shield, 
  Link as LinkIcon, 
  GraduationCap, 
  History,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-slate-50/50 hidden md:block shrink-0">
                <div className="p-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">EVE</span>
                    </div>
                </div>
                <nav className="space-y-1 px-4">
                    <SidebarLink href="/dashboard" icon={MessageSquare}>
                        Chat with Eve
                    </SidebarLink>
                    <SidebarLink href="/dashboard/intelligence" icon={Brain}>
                        Your AI Profile
                    </SidebarLink>
                    <SidebarLink href="/dashboard/data-sources" icon={Database}>
                        Data Sources
                    </SidebarLink>
                    <SidebarLink href="/dashboard/integrations" icon={LinkIcon}>
                        Connect Tools
                    </SidebarLink>
                    <SidebarLink href="/dashboard/learning" icon={GraduationCap}>
                        How Eve Learns
                    </SidebarLink>
                    <SidebarLink href="/dashboard/actions" icon={History}>
                        Action History
                    </SidebarLink>
                    <SidebarLink href="/dashboard/settings" icon={Settings}>
                        Settings
                    </SidebarLink>
                    
                    <div className="pt-4 mt-4 border-t border-slate-200">
                        <SidebarLink href="/admin/prompts" icon={Shield}>
                            Manage Prompts
                        </SidebarLink>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 bg-white">
                {children}
            </main>
        </div>
    );
}

function SidebarLink({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link 
            href={href} 
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group ${
                isActive 
                ? 'text-slate-900 bg-slate-100' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
            <Icon 
                className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                }`} 
                strokeWidth={isActive ? 2 : 1.5} 
            />
            {children}
        </Link>
    );
}
