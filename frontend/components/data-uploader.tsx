'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataUploaderProps {
    tenantId: string;
    onUploadComplete?: () => void;
}

export function DataUploader({ tenantId, onUploadComplete }: DataUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            // Simulate upload delay for demo
            await new Promise(resolve => setTimeout(resolve, 2000));

            // In a real app, use Supabase Storage here
            // const { data, error } = await supabase.storage...

            setSuccess(true);
            if (onUploadComplete) {
                onUploadComplete();
            }
        } catch (err) {
            setError('Failed to upload document.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    }, [tenantId, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'text/csv': ['.csv'],
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    return (
        <Card className="w-full">
            <CardContent className="p-6">
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                        uploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="p-4 bg-muted rounded-full">
                            {uploading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : success ? (
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : error ? (
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            ) : (
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                                {uploading ? "Uploading..." : success ? "Upload Complete" : "Upload Document"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {uploading ? "Processing and embedding content..." :
                                    success ? "Your document has been indexed." :
                                        "Drag & drop or click to upload PDF, CSV, DOCX"}
                            </p>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
