import { OpenAI } from 'openai';

// Model name for embeddings
const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * Gets or creates the OpenAI client instance.
 * Ensures environment variables are loaded before initialization.
 */
function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined;

  if (!apiKey) {
    throw new Error('Missing API key for embeddings. Please set OPENROUTER_API_KEY or OPENAI_API_KEY.');
  }

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: false,
  });
}

/**
 * Generates a single embedding for the given text using the OpenAI SDK directly.
 * 
 * @param text The text to embed
 * @returns Promise<number[]> The embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generates embeddings for multiple texts in a single batch.
 * 
 * @param texts Array of strings to embed
 * @returns Promise<number[][]> Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const openai = getClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    throw error;
  }
}

/**
 * Dimension of the vectors returned by text-embedding-3-small
 */
export const EMBEDDING_DIMENSION = 1536;
