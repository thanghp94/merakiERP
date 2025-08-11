const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugLoginFlow() {
  console.log('🔍 Comprehensive Login Flow Debug...\n');

  try {
    // Step 1: Test basic connection
    console.log('1. 🌐 Testing Supabase Connection...');
    const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      console.log('   ❌ Connection error:', sessionError.message);
      return;
    }
    
    console.log('   ✅ Connection successful');
    console.log('   👤 Current user:', currentUser?.email || 'None');

    // Step 2: Clear any existing session
    console.log('\n2. 🧹 Clearing existing session...');
    await supabase.auth.signOut();
    console.log('   ✅ Session cleared');

    // Step 3: Test login with admin credentials
    console.log('\n3. 🔐 Testing Admin Login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'Admin123!'
    });

    if (loginError) {
      console.log('   ❌ Login failed:', loginError.message);
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('\n🚨 ISSUE FOUND: Email confirmation required');
        console.log('📋 SOLUTION:');
        console.log('   1. Go to Supabase Dashboard');
        console.log('   2. Authentication → Settings');
        console.log('   3. Turn OFF "Enable email confirmations"');
        console.log('   4. Save settings');
        return;
      }
      
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n🚨 ISSUE FOUND: Invalid credentials');
        console.log('📋 Let\'s create a fresh admin user...');
        
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
          console.log('   ✅ New admin user created');
          console.log('   📧 Check if email confirmation is required');
        }
        return;
      }
      
      return;
    }

    console.log('   ✅ Login successful!');
    console.log('   👤 User:', loginData.user?.email);
    console.log('   🎭 Role:', loginData.user?.user_metadata?.role);
    console.log('   🔑 Session:', !!loginData.session);

    // Step 4: Test session persistence
    console.log('\n4. 📱 Testing Session Persistence...');
    const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
    
    if (getSessionError) {
      console.log('   ❌ Session retrieval error:', getSessionError.message);
    } else if (!session) {
      console.log('   ❌ No session found after login');
      console.log('   🚨 This indicates a session persistence issue');
    } else {
      console.log('   ✅ Session persisted successfully');
      console.log('   ⏰ Expires at:', new Date(session.expires_at * 1000).toLocaleString());
    }

    // Step 5: Test auth state change listener
    console.log('\n5. 👂 Testing Auth State Changes...');
    let authStateChanged = false;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`   📡 Auth event: ${event}`);
      console.log(`   👤 Session user: ${session?.user?.email || 'None'}`);
      authStateChanged = true;
    });

    // Wait a moment for auth state change
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!authStateChanged) {
      console.log('   ⚠️  No auth state change detected');
    }
    
    subscription.unsubscribe();

    // Step 6: Check Supabase configuration
    console.log('\n6. ⚙️  Checking Configuration...');
    console.log('   🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('   🔑 Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

    // Step 7: Recommendations
    console.log('\n7. 💡 Recommendations:');
    console.log('   1. Ensure email confirmation is DISABLED in Supabase Dashboard');
    console.log('   2. Add http://localhost:3000 to Site URL in Auth settings');
    console.log('   3. Add http://localhost:3000/dashboard to Redirect URLs');
    console.log('   4. Check browser console for any JavaScript errors');
    console.log('   5. Try opening browser dev tools and check Network tab during login');

    console.log('\n8. 🧪 Manual Test Steps:');
    console.log('   1. Open http://localhost:3000/auth/login');
    console.log('   2. Open browser dev tools (F12)');
    console.log('   3. Go to Console tab');
    console.log('   4. Try logging in with admin@merakierp.com / Admin123!');
    console.log('   5. Watch for any error messages in console');
    console.log('   6. Check Network tab for failed requests');

    // Clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugLoginFlow();
