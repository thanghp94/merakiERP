require('dotenv').config({ path: '.env.local' });

console.log('🔍 Debugging environment variables...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Check:');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
console.log('URL value:', supabaseUrl);

if (supabaseAnonKey) {
  console.log('Key length:', supabaseAnonKey.length);
  console.log('Key starts with:', supabaseAnonKey.substring(0, 10) + '...');
  console.log('Key format check:');
  console.log('  - Starts with "eyJ":', supabaseAnonKey.startsWith('eyJ'));
  console.log('  - Contains dots:', supabaseAnonKey.includes('.'));
  console.log('  - Length > 100:', supabaseAnonKey.length > 100);
  
  // Check for common issues
  if (supabaseAnonKey.includes(' ')) {
    console.log('⚠️  WARNING: Key contains spaces');
  }
  if (supabaseAnonKey.includes('\n')) {
    console.log('⚠️  WARNING: Key contains newlines');
  }
  if (supabaseAnonKey === 'your_anon_key_here') {
    console.log('❌ ERROR: Key is still placeholder value');
  }
} else {
  console.log('❌ No API key found');
}

console.log('\n💡 Expected format:');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('\n📝 To get the correct key:');
console.log('1. Go to https://app.supabase.com/');
console.log('2. Select your project');
console.log('3. Settings > API');
console.log('4. Copy the "anon public" key');
