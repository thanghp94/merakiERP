const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin for emulator
const app = initializeApp({
  projectId: 'merakierp',
});

const auth = getAuth(app);

async function createTestUsers() {
  try {
    console.log('👤 Creating test users in Firebase Auth emulator...');

    // Create admin user
    const adminUser = await auth.createUser({
      uid: 'admin-001',
      email: 'admin@merakierp.com',
      password: 'Admin123!',
      displayName: 'System Administrator',
      emailVerified: true,
    });

    // Set admin custom claims (role)
    await auth.setCustomUserClaims(adminUser.uid, {
      role: 'admin'
    });

    console.log('✅ Created admin user:', {
      uid: adminUser.uid,
      email: adminUser.email,
      role: 'admin'
    });

    // Create teacher user
    const teacherUser = await auth.createUser({
      uid: 'teacher-001',
      email: 'teacher@merakierp.com',
      password: 'Teacher123!',
      displayName: 'Sarah Johnson',
      emailVerified: true,
    });

    await auth.setCustomUserClaims(teacherUser.uid, {
      role: 'teacher'
    });

    console.log('✅ Created teacher user:', {
      uid: teacherUser.uid,
      email: teacherUser.email,
      role: 'teacher'
    });

    // Create student user
    const studentUser = await auth.createUser({
      uid: 'student-001',
      email: 'student@merakierp.com',
      password: 'Student123!',
      displayName: 'Nguyen Van An',
      emailVerified: true,
    });

    await auth.setCustomUserClaims(studentUser.uid, {
      role: 'student'
    });

    console.log('✅ Created student user:', {
      uid: studentUser.uid,
      email: studentUser.email,
      role: 'student'
    });

    console.log('\n🎉 All test users created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@merakierp.com / Admin123!');
    console.log('Teacher: teacher@merakierp.com / Teacher123!');
    console.log('Student: student@merakierp.com / Student123!');
    console.log('\n🔗 Access the app at: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
  }
}

// Run the user creation script
createTestUsers();