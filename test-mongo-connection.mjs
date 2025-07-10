// test-mongo-connection.mjs
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('MongoDB connection successful!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

testConnection();
