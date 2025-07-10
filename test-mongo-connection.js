// test-mongo-connection.js
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env.local' });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
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
