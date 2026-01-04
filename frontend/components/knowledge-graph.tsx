'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg" />
});

interface KnowledgeGraphProps {
    tenantId: string;
}

import { supabase } from '@/lib/supabase';

// ...

export function KnowledgeGraph({ tenantId }: KnowledgeGraphProps) {
    const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: 400
            });
        }

        const fetchData = async () => {
            try {
                // Fetch from Supabase directly
                const { data: docs, error } = await supabase
                    .from('documents')
                    .select('id, metadata')
                    .limit(20); // Limit for graph performance

                if (error) throw error;

                // Construct Star Topology
                // Center Node
                const nodes: any[] = [{ id: 'central', name: 'EVE Core', val: 20, color: '#3b82f6' }];
                const links: any[] = [];

                docs?.forEach((doc: any) => {
                    const name = doc.metadata?.name || 'Document';
                    nodes.push({ id: doc.id, name: name, val: 5, color: '#10b981' });
                    links.push({ source: 'central', target: doc.id });
                });

                setData({ nodes, links });
            } catch (e) {
                console.error("Graph fetch failed", e);
            }
        };

        fetchData();
    }, [tenantId]);


    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-indigo-500" />
                    Network Visualization
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden h-[400px]" ref={containerRef}>
                <div style={{ width: dimensions.width, height: dimensions.height }}>
                    <ForceGraph2D
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={data}
                        nodeLabel="name"
                        nodeColor="color"
                        nodeRelSize={6}
                        linkColor={() => '#e5e7eb'}
                        backgroundColor="#ffffff"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
