const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixAdminRole() {
  console.log('🔧 Fixing Admin User Role...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // First, sign in as admin to get the user
    console.log('1. 🔑 Signing in as admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('   ✅ Sign in successful!');
    console.log('   👤 User ID:', signInData.user.id);
    console.log('   📧 Email:', signInData.user.email);
    console.log('   🎭 Current Role:', signInData.user.user_metadata?.role || 'undefined');
    console.log('   📝 Current Metadata:', JSON.stringify(signInData.user.user_metadata, null, 2));

    // Update user metadata with admin role
    console.log('\n2. 🛠️  Updating user role to admin...');
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: 'Admin User',
        role: 'admin'
      }
    });

    if (updateError) {
      console.log('   ❌ Update failed:', updateError.message);
    } else {
      console.log('   ✅ User role updated successfully!');
      console.log('   🎭 New Role:', updateData.user?.user_metadata?.role);
      console.log('   👤 Full Name:', updateData.user?.user_metadata?.full_name);
    }

    // Verify the update
    console.log('\n3. ✅ Verifying the update...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('   ❌ Verification failed:', userError.message);
    } else {
      console.log('   ✅ Verification successful!');
      console.log('   🎭 Verified Role:', userData.user?.user_metadata?.role);
      console.log('   👤 Verified Name:', userData.user?.user_metadata?.full_name);
    }

    // Test the JWT login API with updated user
    console.log('\n4. 🧪 Testing JWT login API...');
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
      console.log('   ✅ JWT login successful!');
      console.log('   🔑 Token received:', !!jwtResult.token);
      
      // Decode the JWT to check role
      if (jwtResult.token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(jwtResult.token);
        console.log('   🎭 Token Role:', decoded?.role);
        console.log('   👤 Token Name:', decoded?.full_name);
      }
    } else {
      console.log('   ❌ JWT login failed:', jwtResult.error);
    }

    // Sign out
    await supabase.auth.signOut();

    console.log('\n📋 Summary:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Admin user role has been updated');
    console.log('✅ Please refresh your browser or log out and log back in');
    console.log('✅ You should now see "Quản trị viên" instead of "Học sinh"');
    console.log('✅ Admin features should now be available');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

fixAdminRole();
