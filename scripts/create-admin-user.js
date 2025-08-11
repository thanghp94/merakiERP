const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAdminUser() {
  console.log('🔧 Creating Fresh Admin User...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // First, try to sign up a new admin user
    console.log('1. 👤 Creating admin user...');
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
      if (signupError.message.includes('already registered')) {
        console.log('   ⚠️  User already exists, trying to sign in...');
        
        // Try to sign in with existing user
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: 'admin@merakierp.com',
          password: 'Admin123!'
        });

        if (signinError) {
          console.log('   ❌ Sign in failed:', signinError.message);
          
          if (signinError.message.includes('Email not confirmed')) {
            console.log('\n🚨 ISSUE: Email confirmation is still required');
            console.log('📋 SOLUTIONS:');
            console.log('   1. Check Supabase Dashboard > Authentication > Settings');
            console.log('   2. Make sure "Confirm email" is turned OFF');
            console.log('   3. Try refreshing the page and saving again');
            console.log('   4. Or manually confirm the user in Supabase Dashboard > Authentication > Users');
          } else if (signinError.message.includes('Invalid login credentials')) {
            console.log('\n🚨 ISSUE: Invalid credentials');
            console.log('📋 SOLUTION: User might not exist or password is wrong');
          }
        } else {
          console.log('   ✅ Sign in successful!');
          console.log('   👤 User:', signinData.user?.email);
          console.log('   🎭 Role:', signinData.user?.user_metadata?.role);
          
          // Sign out to clean up
          await supabase.auth.signOut();
        }
      } else {
        console.log('   ❌ Signup failed:', signupError.message);
      }
    } else {
      console.log('   ✅ Admin user created successfully!');
      console.log('   👤 User:', signupData.user?.email);
      console.log('   🎭 Role:', signupData.user?.user_metadata?.role);
      console.log('   📧 Confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
      
      if (!signupData.user?.email_confirmed_at) {
        console.log('\n⚠️  Email not confirmed automatically');
        console.log('📋 This might be why login is failing');
      }
    }

    // Test the login API endpoint
    console.log('\n2. 🧪 Testing login API endpoint...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@merakierp.com',
        password: 'Admin123!'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Login API successful!');
      console.log('   🔑 Token received:', !!result.token);
    } else {
      console.log('   ❌ Login API failed:', result.error);
    }

    console.log('\n3. 📋 Summary:');
    console.log('   - Admin user: admin@merakierp.com / Admin123!');
    console.log('   - Login page: http://localhost:3000/auth/login');
    console.log('   - Dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

createAdminUser();
