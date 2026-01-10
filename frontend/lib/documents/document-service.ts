import { createClient } from '@supabase/supabase-js';
import { generateEmbeddings, EMBEDDING_DIMENSION } from '@/lib/ai/embeddings';

// Types
export interface Document {
  id: string;
  user_id: string;
  tenant_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message?: string;
  chunk_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  tenant_id: string;
  content: string;
  embedding: number[];
  chunk_index: number;
  token_count: number;
  metadata: Record<string, any>;
}

// Configuration
const CHUNK_SIZE = 500; // Target tokens per chunk
const CHUNK_OVERLAP = 100; // Overlap between chunks
const CHARS_PER_TOKEN = 4; // Approximate

// Supabase client getter (lazy initialization to avoid build-time errors)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
}

/**
 * Parse document content based on file type
 */
export async function parseDocument(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      // Dynamic import to avoid issues with edge runtime/turbopack
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await (pdfParse as any)(fileBuffer);
      return pdfData.text;

    case 'docx':
      const mammoth = await import('mammoth');
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      return docxResult.value;

    case 'txt':
    case 'md':
    case 'csv':
      return fileBuffer.toString('utf-8');

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const targetChars = CHUNK_SIZE * CHARS_PER_TOKEN;
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN;

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph would exceed target, save current chunk
    if (currentChunk.length + trimmedParagraph.length > targetChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlapChars / 5)); // Approximate words
      currentChunk = overlapWords.join(' ') + ' ' + trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle case where a single chunk is still too large
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > targetChars * 1.5) {
      // Split by sentences if chunk is too large
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let subChunk = '';
      for (const sentence of sentences) {
        if (subChunk.length + sentence.length > targetChars) {
          if (subChunk) finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += sentence;
        }
      }
      if (subChunk) finalChunks.push(subChunk.trim());
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.filter(c => c.length > 50); // Filter out tiny chunks
}

/**
 * Process a document: parse, chunk, embed, and store
 */
export async function processDocument(documentId: string): Promise<void> {
  console.log(`[DocumentService] Processing document: ${documentId}`);

  try {
    // Update status to processing
    await getSupabaseAdmin()
      .from('documents')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Get document record
    const { data: doc, error: fetchError } = await getSupabaseAdmin()
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await getSupabaseAdmin().storage
      .from('documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Parse document
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    const textContent = await parseDocument(fileBuffer, doc.file_type);

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('Document appears to be empty or unreadable');
    }

    console.log(`[DocumentService] Parsed ${textContent.length} characters`);

    // Chunk the text
    const chunks = chunkText(textContent);
    console.log(`[DocumentService] Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('No valid chunks created from document');
    }

    // Generate embeddings in batches
    const BATCH_SIZE = 50;
    const allChunksWithEmbeddings: Array<{
      document_id: string;
      user_id: string;
      tenant_id: string;
      content: string;
      embedding: number[];
      chunk_index: number;
      token_count: number;
      metadata: Record<string, any>;
    }> = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch);

      for (let j = 0; j < batch.length; j++) {
        allChunksWithEmbeddings.push({
          document_id: documentId,
          user_id: doc.user_id,
          tenant_id: doc.tenant_id,
          content: batch[j],
          embedding: embeddings[j],
          chunk_index: i + j,
          token_count: Math.ceil(batch[j].length / CHARS_PER_TOKEN),
          metadata: {
            filename: doc.original_filename,
            chunk_of_total: `${i + j + 1}/${chunks.length}`
          }
        });
      }

      console.log(`[DocumentService] Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`);
    }

    // Store chunks in database
    const { error: insertError } = await getSupabaseAdmin()
      .from('document_chunks')
      .insert(allChunksWithEmbeddings);

    if (insertError) {
      throw new Error(`Failed to store chunks: ${insertError.message}`);
    }

    // Update document status to ready
    await getSupabaseAdmin()
      .from('documents')
      .update({
        status: 'ready',
        chunk_count: chunks.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    console.log(`[DocumentService] Document processed successfully: ${documentId}`);

  } catch (error) {
    console.error(`[DocumentService] Error processing document:`, error);

    // Update status to error
    await getSupabaseAdmin()
      .from('documents')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    throw error;
  }
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchDocuments(
  userId: string,
  query: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<Array<{ content: string; metadata: Record<string, any>; similarity: number }>> {
  
  // Generate embedding for query
  const { generateEmbedding } = await import('@/lib/ai/embeddings');
  const queryEmbedding = await generateEmbedding(query);

  // Search using vector similarity
  // Note: This requires the pgvector extension and a custom function in Supabase
  const { data, error } = await getSupabaseAdmin().rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_threshold: similarityThreshold,
    match_count: limit
  });

  if (error) {
    console.error('[DocumentService] Search error:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a document and all its chunks
 */
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  // Get document to verify ownership and get storage path
  const { data: doc, error: fetchError } = await getSupabaseAdmin()
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !doc) {
    throw new Error('Document not found or access denied');
  }

  // Delete from storage
  await getSupabaseAdmin().storage
    .from('documents')
    .remove([doc.storage_path]);

  // Delete from database (chunks will cascade delete)
  await getSupabaseAdmin()
    .from('documents')
    .delete()
    .eq('id', documentId);
}
