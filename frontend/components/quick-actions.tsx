'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, AlertTriangle, Network } from "lucide-react";

interface QuickActionsProps {
    onAction: (prompt: string) => void;
}

const actions = [
    {
        title: "Audit Invoice",
        icon: <Search className="h-6 w-6 text-blue-500" />,
        prompt: "Analyze the uploaded invoice against the policy for non-compliance. Identify any discrepancies."
    },
    {
        title: "Summarize Policy",
        icon: <FileText className="h-6 w-6 text-green-500" />,
        prompt: "Summarize the key constraints, limits, and allowances in this document."
    },
    {
        title: "Find Risks",
        icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
        prompt: "Identify any high-risk clauses, financial discrepancies, or unusual terms."
    },
    {
        title: "Create Graph",
        icon: <Network className="h-6 w-6 text-purple-500" />,
        prompt: "Extract entities and relationships from the text to visualize the data structure."
    }
];

export function QuickActions({ onAction }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 mb-8">
            {actions.map((action, idx) => (
                <Card
                    key={idx}
                    className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 shadow-sm"
                    onClick={() => onAction(action.prompt)}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100">
                            {action.icon}
                        </div>
                        <span className="font-medium text-sm text-slate-700">{action.title}</span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
