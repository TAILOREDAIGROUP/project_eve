'use client';

import { useState, useEffect } from 'react';
import { File, Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface Document {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message?: string;
  chunk_count: number;
  created_at: string;
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Refresh every 10 seconds to catch status updates
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setDeletingId(id);
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center text-xs text-red-600 bg-red-100 px-2 py-1 rounded" title={errorMessage}>
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No documents uploaded yet</p>
        <p className="text-sm">Upload documents to use them in your conversations</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Your Documents</h3>
        <button
          onClick={fetchDocuments}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <File className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{doc.original_filename}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                {doc.status === 'ready' && ` • ${doc.chunk_count} chunks`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {getStatusBadge(doc.status, doc.error_message)}
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 disabled:opacity-50"
              title="Delete document"
            >
              {deletingId === doc.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
