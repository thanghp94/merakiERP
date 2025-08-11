const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugUserRoleIssue() {
  console.log('🔍 Debugging User Role Display Issue...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Test 1: Check Supabase user data
    console.log('1. 🔑 Checking Supabase user data...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (signInError) {
      console.log('   ❌ Supabase sign in failed:', signInError.message);
      return;
    }

    console.log('   ✅ Supabase user data:');
    console.log('   📧 Email:', signInData.user?.email);
    console.log('   🎭 Role from metadata:', signInData.user?.user_metadata?.role);
    console.log('   👤 Full name:', signInData.user?.user_metadata?.full_name);
    console.log('   📝 Complete metadata:', JSON.stringify(signInData.user?.user_metadata, null, 2));

    // Test 2: Check JWT token data
    console.log('\n2. 🔧 Checking JWT token data...');
    const jwtResponse = await fetch('http://localhost:3000/api/auth/login', {
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
    
    if (jwtResponse.ok && jwtResult.token) {
      console.log('   ✅ JWT token received');
      
      // Decode JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(jwtResult.token);
      console.log('   🎭 Role from JWT:', decoded?.role);
      console.log('   👤 Name from JWT:', decoded?.full_name);
      console.log('   📧 Email from JWT:', decoded?.email);
      console.log('   📝 Complete JWT payload:', JSON.stringify(decoded, null, 2));
    } else {
      console.log('   ❌ JWT login failed:', jwtResult.error);
    }

    // Test 3: Check what the AuthContext might be using
    console.log('\n3. 🧩 Analyzing potential AuthContext issue...');
    console.log('   💡 The issue might be:');
    console.log('   1. AuthContext is using Supabase session instead of JWT token');
    console.log('   2. Browser cache/cookies are not updated');
    console.log('   3. Frontend needs to be refreshed after role update');
    
    console.log('\n4. 🔧 Recommended solutions:');
    console.log('   1. Clear browser cookies and localStorage');
    console.log('   2. Log out and log back in using the login form');
    console.log('   3. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('   4. Check if AuthContext is properly using JWT tokens');

    // Test 4: Check the current session vs JWT difference
    console.log('\n5. 📊 Data comparison:');
    console.log('   Supabase Session Role:', signInData.user?.user_metadata?.role || 'undefined');
    
    if (jwtResult.token) {
      const decoded = jwt.decode(jwtResult.token);
      console.log('   JWT Token Role:', decoded?.role || 'undefined');
      
      if (signInData.user?.user_metadata?.role !== decoded?.role) {
        console.log('   ⚠️  MISMATCH DETECTED! Session and JWT have different roles');
      } else {
        console.log('   ✅ Session and JWT roles match');
      }
    }

    await supabase.auth.signOut();

    console.log('\n📋 Next Steps:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. Clear browser data (cookies, localStorage)');
    console.log('2. Go to: http://localhost:3000/auth/login');
    console.log('3. Log in fresh with: admin@merakierp.com / Admin123!');
    console.log('4. Should now show "Quản trị viên" instead of "Học sinh"');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUserRoleIssue();
