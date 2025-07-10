// test-env.js
const fs = require('fs');
const path = require('path');

// Read .env.local file contents
const envFilePath = path.join(process.cwd(), '.env.local');
const fileContents = fs.readFileSync(envFilePath, 'utf8');

console.log('ENV file contents:');
console.log(fileContents);

// Load environment variables
require('dotenv').config({ path: './.env.local' });

// Check MongoDB URI
console.log('MONGODB_URI in process.env:', process.env.MONGODB_URI);

// Create mongoose connection function
const mongoose = require('mongoose');
async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('MongoDB connection successful!');
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Run the test
testConnection();
