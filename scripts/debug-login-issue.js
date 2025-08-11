const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugLoginIssue() {
  console.log('🔍 Debugging Login Issue...\n');

  try {
    // Test 1: Check if user exists and can sign in
    console.log('1. 🧪 Testing Admin Login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message);
      
      if (signInError.message.includes('Email not confirmed')) {
        console.log('   📧 Issue: Email confirmation required');
        console.log('   💡 Solution: Disable email confirmation in Supabase Dashboard');
        console.log('      Go to: Authentication > Settings > Email Auth');
        console.log('      Turn OFF "Enable email confirmations"');
      } else if (signInError.message.includes('Invalid login credentials')) {
        console.log('   🔑 Issue: Invalid credentials');
        console.log('   💡 Try creating a new user or check password');
      }
    } else {
      console.log('   ✅ Sign in successful!');
      console.log('   👤 User:', signInData.user?.email);
      console.log('   🎭 Role:', signInData.user?.user_metadata?.role);
      
      // Test session persistence
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('   📱 Session active:', !!sessionData.session);
    }

    // Test 2: Check Supabase configuration
    console.log('\n2. ⚙️  Checking Supabase Configuration...');
    console.log('   🌐 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('   🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

    // Test 3: Check auth settings
    console.log('\n3. 🔐 Recommended Auth Settings:');
    console.log('   Go to Supabase Dashboard > Authentication > Settings');
    console.log('   📧 Email Auth: Disable "Enable email confirmations" for development');
    console.log('   🔗 Site URL: Add http://localhost:3000');
    console.log('   ↩️  Redirect URLs: Add http://localhost:3000/dashboard');

    console.log('\n4. 🚀 Next Steps:');
    console.log('   1. Apply the auth settings above');
    console.log('   2. Try logging in again at: http://localhost:3000/auth/login');
    console.log('   3. Use credentials: admin@merakierp.com / Admin123!');
    console.log('   4. Should redirect to: http://localhost:3000/dashboard');

    // Sign out for clean state
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLoginIssue();
