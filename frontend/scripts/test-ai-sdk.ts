import { generateEmbedding } from '../lib/ai/embeddings';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
  console.log('Testing AI SDK upgrade...');
  
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY or OPENROUTER_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    // Test embedding generation
    console.log('Generating embedding for "Hello, world!"...');
    const embedding = await generateEmbedding('Hello, world!');
    console.log('Embedding dimension:', embedding.length);
    console.log('First 5 values:', embedding.slice(0, 5));
    
    if (embedding.length === 1536) {
      console.log('✅ Embedding test passed!');
    } else {
      console.log('❌ Embedding test failed - unexpected dimension');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

test().catch(console.error);
