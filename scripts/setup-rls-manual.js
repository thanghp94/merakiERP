const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up Row Level Security (RLS) Policies\n');

// Read the RLS policies SQL file
const sqlPath = path.join(__dirname, '../database/rls-policies.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('📋 MANUAL SETUP INSTRUCTIONS:');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1. 🌐 Go to your Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/lunkgjarwqqkpbohneqn\n');

console.log('2. 📝 Navigate to SQL Editor:');
console.log('   Dashboard → SQL Editor → New Query\n');

console.log('3. 📋 Copy and paste the following SQL code:\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log(sqlContent);
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('4. ▶️  Click "Run" to execute all the policies\n');

console.log('5. ✅ Verify the setup:');
console.log('   - Go to Authentication → Policies');
console.log('   - You should see policies for all tables');
console.log('   - Each table should show "RLS enabled"\n');

console.log('6. 🧪 Test the setup:');
console.log('   Run: node scripts/apply-rls-policies.js test\n');

console.log('📝 What these policies do:');
console.log('   • Students can only see their own data');
console.log('   • Teachers can see all students and manage their sessions');
console.log('   • TAs can assist with sessions they\'re assigned to');
console.log('   • Admins have full access to everything');
console.log('   • All tables are protected by Row Level Security\n');

console.log('🔐 Security Features:');
console.log('   • JWT token validation');
console.log('   • Role-based access control');
console.log('   • Resource ownership checks');
console.log('   • Automatic user context from auth.jwt()');

console.log('\n🎯 After applying these policies, your database will be secure!');
