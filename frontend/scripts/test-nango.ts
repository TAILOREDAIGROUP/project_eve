import { Nango } from '@nangohq/node';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from frontend directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

async function testNango() {
  console.log('Testing Nango connection...');
  console.log('Secret Key exists:', !!process.env.NANGO_SECRET_KEY);
  console.log('Secret Key prefix:', process.env.NANGO_SECRET_KEY?.substring(0, 5));
  
  try {
    // List all connections for our tenant
    const connections = await nango.listConnections();
    console.log('Nango connections:', JSON.stringify(connections, null, 2));
    console.log('✅ Nango SDK is working');
  } catch (error: any) {
    console.error('❌ Nango error:', error.message || error);
  }
}

testNango();
