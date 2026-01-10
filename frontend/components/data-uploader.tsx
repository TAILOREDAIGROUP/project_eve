'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedDocument {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message?: string;
}

export function DataUploader() {
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setUploads((prev) => [...prev, {
            id: data.document.id,
            filename: data.document.filename,
            status: 'pending'
          }]);

          // Poll for status updates
          pollDocumentStatus(data.document.id);
        } else {
          setUploads((prev) => [...prev, {
            id: crypto.randomUUID(),
            filename: file.name,
            status: 'error',
            error_message: data.error
          }]);
        }
      } catch (error) {
        setUploads((prev) => [...prev, {
          id: crypto.randomUUID(),
          filename: file.name,
          status: 'error',
          error_message: 'Upload failed'
        }]);
      }
    }

    setIsUploading(false);
  }, []);

  const pollDocumentStatus = async (documentId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const response = await fetch('/api/documents');
        const data = await response.json();
        
        const doc = data.documents?.find((d: any) => d.id === documentId);
        
        if (doc) {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === documentId
                ? { ...u, status: doc.status, error_message: doc.error_message }
                : u
            )
          );

          if (doc.status === 'pending' || doc.status === 'processing') {
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000); // Poll every 5 seconds
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600 dark:text-blue-400">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-300">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-400 mt-2">
              PDF, DOCX, TXT, MD, CSV • Max 10MB
            </p>
          </div>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Uploaded Documents
          </h4>
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {upload.filename}
                  </p>
                  {upload.error_message && (
                    <p className="text-xs text-red-500">{upload.error_message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(upload.status)}
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
