#!/usr/bin/env node
// filepath: /home/neupane/Desktop/student/student/scripts/check-cloudinary-config.js
require('dotenv').config({ path: '.env.local' });
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

console.log(`${colors.cyan}=== Cloudinary Configuration Checker ===${colors.reset}\n`);

// Check environment variables
function checkEnvVars() {
  console.log(`${colors.magenta}Checking environment variables...${colors.reset}`);
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  ];

  const missing = [];
  const configured = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`${colors.red}❌ Missing: ${varName}${colors.reset}`);
    } else {
      configured.push(varName);
      console.log(`${colors.green}✅ Configured: ${varName}${colors.reset}`);
    }
  });

  if (process.env.CLOUDINARY_CLOUD_NAME !== process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.log(`${colors.yellow}⚠️  Warning: CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME values are different${colors.reset}`);
  }

  return { missing, configured };
}

// Check Cloudinary connection
async function checkCloudinaryConnection() {
  console.log(`\n${colors.magenta}Testing Cloudinary connection...${colors.reset}`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log(`${colors.red}❌ Cannot test connection: Missing configuration${colors.reset}`);
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    const result = await cloudinary.api.ping();
    console.log(`${colors.green}✅ Cloudinary connection successful!${colors.reset}`);
    console.log(`${colors.blue}Status: ${result.status}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Cloudinary connection failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Test upload capability
async function testUpload() {
  console.log(`\n${colors.magenta}Testing upload capability...${colors.reset}`);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.log(`${colors.red}❌ Cannot test upload: Missing configuration${colors.reset}`);
    return false;
  }

  try {
    // Create a simple test image (1x1 pixel transparent PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${testImageBase64}`,
      { 
        folder: 'test-uploads',
        public_id: 'diagnostic-test-' + Date.now()
      }
    );

    console.log(`${colors.green}✅ Test upload successful!${colors.reset}`);
    console.log(`${colors.blue}URL: ${result.secure_url}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Test upload failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main function
async function main() {
  // Check for environment variables
  const envCheck = checkEnvVars();
  
  // Test connection if we have credentials
  const connectionOk = await checkCloudinaryConnection();
  
  // Test upload if connection was successful
  let uploadOk = false;
  if (connectionOk) {
    uploadOk = await testUpload();
  }
  
  // Summary
  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Environment Variables: ${envCheck.missing.length === 0 ? colors.green + 'OK' : colors.red + 'Missing ' + envCheck.missing.length}${colors.reset}`);
  console.log(`Cloudinary Connection: ${connectionOk ? colors.green + 'OK' : colors.red + 'Failed'}${colors.reset}`);
  console.log(`Test Upload: ${uploadOk ? colors.green + 'OK' : colors.red + 'Failed'}${colors.reset}`);
  
  // Final advice
  console.log(`\n${colors.cyan}=== Recommendations ===${colors.reset}`);
  if (envCheck.missing.length > 0) {
    console.log(`${colors.yellow}• Add the missing environment variables to your .env.local file:${colors.reset}`);
    envCheck.missing.forEach(varName => {
      console.log(`  ${varName}=YOUR_VALUE_HERE`);
    });
  }
  
  if (!connectionOk) {
    console.log(`${colors.yellow}• Verify your Cloudinary credentials are correct${colors.reset}`);
    console.log(`${colors.yellow}• Check if your Cloudinary account is active${colors.reset}`);
  }
  
  if (!uploadOk && connectionOk) {
    console.log(`${colors.yellow}• Check if your account has upload permissions${colors.reset}`);
    console.log(`${colors.yellow}• Verify upload limits on your Cloudinary account${colors.reset}`);
  }
  
  console.log('');
}

main().catch(err => {
  console.error(`${colors.red}Error running diagnostics:${colors.reset}`, err);
  process.exit(1);
});
