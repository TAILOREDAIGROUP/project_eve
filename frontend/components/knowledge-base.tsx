'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Document {
    id: string;
    name: string;
    created_at: string;
}

interface KnowledgeBaseProps {
    tenantId: string;
    refreshTrigger?: number;
}

import { supabase } from '@/lib/supabase';

// ... imports

export function KnowledgeBase({ tenantId }: KnowledgeBaseProps) { // removed refreshTrigger for now as simple fix
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            try {
                // Fetch from Supabase directly
                const { data, error } = await supabase
                    .from('documents')
                    .select('id, metadata, created_at') // metadata usually contains 'name'
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Map Supabase structure to UI structure
                const docs = data?.map((d: any) => ({
                    id: d.id,
                    name: d.metadata?.name || 'Untitled Document',
                    created_at: d.created_at || new Date().toISOString()
                })) || [];

                setDocuments(docs);
            } catch (error) {
                console.error("Failed to fetch documents", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [tenantId]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Knowledge Base
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading documents...</div>
                ) : documents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No documents found. Upload one to get started.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="w-[200px]">Ingested</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        {doc.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {/* Date formatting could be better, simplified for now */}
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
