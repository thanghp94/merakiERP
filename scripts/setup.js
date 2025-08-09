#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Meraki ERP...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from .env.example...');
  const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
  fs.writeFileSync(envPath, envExample);
  console.log('✅ .env.local created. Please update with your Supabase credentials.\n');
} else {
  console.log('✅ .env.local already exists.\n');
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.log('❌ Node.js 18+ is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion, '\n');

// Install dependencies if node_modules doesn't exist
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully.\n');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed.\n');
}

// Display next steps
console.log('🎉 Setup completed!\n');
console.log('Next steps:');
console.log('1. Update .env.local with your Supabase credentials');
console.log('2. Run the database schema in your Supabase SQL editor:');
console.log('   - Copy content from database/schema.sql');
console.log('   - Paste and run in Supabase SQL Editor');
console.log('3. Start the development server:');
console.log('   npm run dev\n');
console.log('📚 For more information, see README.md');
