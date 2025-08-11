const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSimpleLogin() {
  console.log('🔍 Simple Login Test...\n');

  // Check environment variables first
  console.log('1. 📋 Environment Variables:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('\n❌ Missing environment variables!');
    console.log('Please check your .env.local file');
    return;
  }

  console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('   Key starts with:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...');

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('\n2. 🔐 Testing Login...');
    
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (error) {
      console.log('   ❌ Login failed:', error.message);
      
      if (error.message.includes('Email not confirmed')) {
        console.log('\n🚨 SOLUTION NEEDED:');
        console.log('   1. Go to Supabase Dashboard');
        console.log('   2. Authentication → Settings');
        console.log('   3. Scroll to "Email Auth"');
        console.log('   4. Turn OFF "Enable email confirmations"');
        console.log('   5. Click Save');
        console.log('\n   Then try logging in again!');
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('\n🚨 User may not exist. Creating new admin user...');
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: 'admin@merakierp.com',
          password: 'Admin123!',
          options: {
            data: {
              full_name: 'Admin User',
              role: 'admin'
            }
          }
        });
        
        if (signupError) {
          console.log('   ❌ Signup failed:', signupError.message);
        } else {
          console.log('   ✅ Admin user created successfully!');
          console.log('   📧 If email confirmation is required, disable it in Supabase Dashboard');
        }
      }
    } else {
      console.log('   ✅ Login successful!');
      console.log('   👤 User:', data.user?.email);
      console.log('   🎭 Role:', data.user?.user_metadata?.role);
      
      // Test session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('   📱 Session active:', !!sessionData.session);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('   🚪 Signed out successfully');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testSimpleLogin();
