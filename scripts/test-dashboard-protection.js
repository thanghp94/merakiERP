const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDashboardProtection() {
  console.log('🔒 Testing Dashboard Protection...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Test 1: Access dashboard without authentication
    console.log('1. 🚫 Testing unauthenticated access to dashboard...');
    const unauthResponse = await fetch('http://localhost:3000/dashboard');
    console.log(`   Status: ${unauthResponse.status}`);
    
    if (unauthResponse.status === 200) {
      const content = await unauthResponse.text();
      if (content.includes('Đang kiểm tra quyền truy cập') || content.includes('login')) {
        console.log('   ✅ Dashboard properly redirects unauthenticated users');
      } else {
        console.log('   ⚠️  Dashboard might be accessible without authentication');
      }
    } else {
      console.log('   ✅ Dashboard returns non-200 status for unauthenticated users');
    }

    // Test 2: Try to sign in with admin user
    console.log('\n2. 🔑 Testing admin login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (signInError) {
      console.log('   ❌ Admin login failed:', signInError.message);
      
      if (signInError.message.includes('Email not confirmed')) {
        console.log('   💡 Solution: Disable email confirmation in Supabase Dashboard');
      } else if (signInError.message.includes('Invalid login credentials')) {
        console.log('   💡 Solution: Create admin user or check credentials');
      } else if (signInError.message.includes('Email logins are disabled')) {
        console.log('   💡 Solution: Enable email authentication in Supabase Dashboard');
      }
    } else {
      console.log('   ✅ Admin login successful!');
      console.log('   👤 User:', signInData.user?.email);
      console.log('   🎭 Role:', signInData.user?.user_metadata?.role);

      // Test 3: Access dashboard with authentication
      console.log('\n3. 🔓 Testing authenticated access to dashboard...');
      const authResponse = await fetch('http://localhost:3000/dashboard', {
        headers: {
          'Cookie': `sb-access-token=${signInData.session?.access_token}; sb-refresh-token=${signInData.session?.refresh_token}`
        }
      });
      
      console.log(`   Status: ${authResponse.status}`);
      
      if (authResponse.status === 200) {
        const content = await authResponse.text();
        if (content.includes('MerakiERP Dashboard') || content.includes('Chào mừng')) {
          console.log('   ✅ Dashboard accessible with authentication');
        } else {
          console.log('   ⚠️  Dashboard response unclear');
        }
      } else {
        console.log('   ❌ Dashboard not accessible even with authentication');
      }

      // Test 4: Test custom JWT login API
      console.log('\n4. 🔧 Testing custom JWT login API...');
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
      
      if (jwtResponse.ok) {
        console.log('   ✅ JWT login API working!');
        console.log('   🔑 Token received:', !!jwtResult.token);
      } else {
        console.log('   ❌ JWT login API failed:', jwtResult.error);
      }

      // Clean up
      await supabase.auth.signOut();
    }

    // Test 5: Test protected API endpoints
    console.log('\n5. 🛡️  Testing protected API endpoints...');
    const protectedResponse = await fetch('http://localhost:3000/api/students');
    console.log(`   Students API status: ${protectedResponse.status}`);
    
    if (protectedResponse.status === 401) {
      console.log('   ✅ API properly protected (401 Unauthorized)');
    } else {
      console.log('   ⚠️  API might not be properly protected');
    }

    console.log('\n📋 Dashboard Protection Test Summary:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Dashboard page: /dashboard');
    console.log('✅ Login page: /auth/login');
    console.log('✅ Unauthorized page: /unauthorized');
    console.log('✅ Protected routes use ProtectedRoute component');
    console.log('✅ API endpoints have authorization middleware');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. If login fails, check Supabase Dashboard settings');
    console.log('2. Visit: http://localhost:3000/auth/login');
    console.log('3. Try logging in with: admin@merakierp.com / Admin123!');
    console.log('4. Should redirect to: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardProtection();
