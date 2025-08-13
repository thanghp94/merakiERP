const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthState() {
  console.log('🔍 Testing Authentication State...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Test 1: Check if we can get current session
    console.log('1. 🔑 Checking current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('   ❌ Session error:', sessionError.message);
    } else {
      console.log('   ✅ Session data:', sessionData.session ? 'Session exists' : 'No session');
      if (sessionData.session) {
        console.log('   👤 User:', sessionData.session.user?.email);
        console.log('   🎭 Role:', sessionData.session.user?.user_metadata?.role);
      }
    }

    // Test 2: Try to sign in
    console.log('\n2. 🔐 Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (signInError) {
      console.log('   ❌ Sign in error:', signInError.message);
    } else {
      console.log('   ✅ Sign in successful!');
      console.log('   👤 User:', signInData.user?.email);
      console.log('   🎭 Role:', signInData.user?.user_metadata?.role);
      console.log('   🔑 Session:', signInData.session ? 'Session created' : 'No session');
    }

    // Test 3: Check JWT token in browser cookies
    console.log('\n3. 🍪 Checking browser cookies...');
    console.log('   💡 You need to check browser cookies manually:');
    console.log('   1. Open browser dev tools (F12)');
    console.log('   2. Go to Application > Cookies > localhost:3001');
    console.log('   3. Look for "token" cookie');
    console.log('   4. If missing, the AuthContext loading will never resolve');

    // Test 4: Test JWT login API
    console.log('\n4. 🧪 Testing JWT login API...');
    const jwtResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@merakierp.com',
        password: 'Admin123!'
      })
    });

    const jwtResult = await jwtResponse.json();
    
    if (jwtResponse.ok) {
      console.log('   ✅ JWT API working!');
      console.log('   🔑 Token received:', !!jwtResult.token);
    } else {
      console.log('   ❌ JWT API failed:', jwtResult.error);
    }

    await supabase.auth.signOut();

    console.log('\n📋 Debugging Steps:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. Clear all browser cookies for localhost:3001');
    console.log('2. Go to: http://localhost:3001/auth/login');
    console.log('3. Login with: admin@merakierp.com / Admin123!');
    console.log('4. Check if "token" cookie is set after login');
    console.log('5. Then try accessing dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthState();
