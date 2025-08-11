const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAuthSetup() {
  console.log('🔐 Testing Supabase Authentication Setup...\n');

  try {
    // Test 1: Check if auth is enabled
    console.log('1. Testing auth configuration...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Auth configuration error:', sessionError.message);
    } else {
      console.log('✅ Auth configuration is working');
      console.log('   Current session:', session ? 'Active' : 'None');
    }

    // Test 2: Test sign up (with a test email)
    console.log('\n2. Testing user registration...');
    const testEmail = 'test-teacher@merakierp.com';
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Teacher',
          role: 'teacher'
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('✅ Sign up working (user already exists)');
      } else {
        console.log('❌ Sign up error:', signUpError.message);
      }
    } else {
      console.log('✅ Sign up successful');
      console.log('   User ID:', signUpData.user?.id);
      console.log('   Email:', signUpData.user?.email);
      console.log('   Metadata:', signUpData.user?.user_metadata);
    }

    // Test 3: Test sign in
    console.log('\n3. Testing user login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError.message);
    } else {
      console.log('✅ Sign in successful');
      console.log('   User ID:', signInData.user?.id);
      console.log('   Email:', signInData.user?.email);
      console.log('   Role:', signInData.user?.user_metadata?.role);
      console.log('   Session expires:', new Date(signInData.session?.expires_at * 1000));
    }

    // Test 4: Test sign out
    console.log('\n4. Testing user logout...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.log('❌ Sign out error:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }

    // Test 5: Check auth state after sign out
    console.log('\n5. Verifying session cleared...');
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    
    if (finalSession) {
      console.log('⚠️  Session still active after sign out');
    } else {
      console.log('✅ Session properly cleared');
    }

    console.log('\n🎉 Authentication setup test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Enable email confirmation in Supabase Dashboard (optional)');
    console.log('   2. Configure email templates');
    console.log('   3. Set up Row Level Security policies');
    console.log('   4. Test the login page at /auth/login');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthSetup();
