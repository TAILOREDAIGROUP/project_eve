'use client';

import React from 'react';
import { 
  Settings, 
  Brain, 
  MessageSquare, 
  FileText, 
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-slate-50/50 hidden md:block shrink-0 flex flex-col">
                <div className="p-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">EVE</span>
                    </div>
                </div>
                <nav className="flex-1 flex flex-col space-y-1 px-4">
                    <SidebarLink href="/dashboard" icon={MessageSquare}>
                        Chat with Eve
                    </SidebarLink>
                    <SidebarLink href="/dashboard/intelligence" icon={Brain}>
                        Your AI Profile
                    </SidebarLink>
                    <SidebarLink href="/dashboard/integrations" icon={Link2}>
                        Integrations
                    </SidebarLink>
                    <SidebarLink href="/dashboard/settings" icon={Settings}>
                        Settings
                    </SidebarLink>
                    
                    <div className="pt-4 mt-4 border-t border-slate-200">
                        <SidebarLink href="/admin/prompts" icon={FileText}>
                            Manage Prompts
                        </SidebarLink>
                    </div>

                    <div className="mt-auto pb-8 pt-4 px-4 border-t border-slate-200">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <UserButton 
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8",
                                    }
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 leading-none">Your Account</span>
                                <span className="text-xs text-slate-500 mt-1">Manage profile</span>
                            </div>
                        </div>
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
