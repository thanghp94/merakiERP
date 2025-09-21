#!/usr/bin/env node

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

console.log('🌱 Seeding Firebase Emulator with sample data...');

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({
  projectId: 'merakierp',
});

const db = getFirestore(app);
const auth = getAuth(app);

async function seedData() {
  try {
    // Create sample users
    console.log('👥 Creating sample users...');
    
    const adminUser = await auth.createUser({
      uid: 'admin-001',
      email: 'admin@merakierp.com',
      password: 'admin123',
      displayName: 'System Administrator',
    });
    
    await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });
    
    const teacherUser = await auth.createUser({
      uid: 'teacher-001',
      email: 'teacher@merakierp.com',
      password: 'teacher123',
      displayName: 'English Teacher',
    });
    
    await auth.setCustomUserClaims(teacherUser.uid, { role: 'teacher' });
    
    const studentUser = await auth.createUser({
      uid: 'student-001',
      email: 'student@merakierp.com',
      password: 'student123',
      displayName: 'John Student',
    });
    
    await auth.setCustomUserClaims(studentUser.uid, { role: 'student' });
    
    // Create sample facilities
    console.log('🏢 Creating sample facilities...');
    const facility1 = await db.collection('facilities').add({
      name: 'Main Campus - District 1',
      status: 'active',
      data: {
        address: '123 Main Street, District 1, Ho Chi Minh City',
        capacity: 500,
        contact_info: {
          phone: '028-1234-5678',
          email: 'district1@merakierp.com'
        },
        amenities: ['WiFi', 'Projectors', 'Audio System', 'Library']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const facility2 = await db.collection('facilities').add({
      name: 'Branch Campus - District 7',
      status: 'active',
      data: {
        address: '456 Secondary Road, District 7, Ho Chi Minh City',
        capacity: 300,
        contact_info: {
          phone: '028-8765-4321',
          email: 'district7@merakierp.com'
        },
        amenities: ['WiFi', 'Projectors', 'Audio System']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create sample employees
    console.log('👨‍🏫 Creating sample employees...');
    const employee1 = await db.collection('employees').add({
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@merakierp.com',
      phone: '0901-234-567',
      position: 'Senior English Teacher',
      status: 'active',
      data: {
        hire_date: '2023-01-15',
        specialization: ['IELTS', 'TOEFL', 'Business English'],
        experience_years: 8
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create sample classes
    console.log('📚 Creating sample classes...');
    const class1 = await db.collection('classes').add({
      class_name: 'English Beginner A1 - Morning',
      facility_id: facility1.id,
      status: 'active',
      start_date: '2024-01-15',
      data: {
        end_date: '2024-04-15',
        level: 'beginner',
        max_students: 15,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '08:00-10:00'
        },
        instructor_id: employee1.id,
        description: 'Basic English for absolute beginners'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const class2 = await db.collection('classes').add({
      class_name: 'IELTS Preparation - Evening',
      facility_id: facility1.id,
      status: 'active',
      start_date: '2024-02-01',
      data: {
        end_date: '2024-05-01',
        level: 'intermediate',
        max_students: 12,
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '18:00-20:00'
        },
        instructor_id: employee1.id,
        description: 'IELTS test preparation course'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create sample students
    console.log('👨‍🎓 Creating sample students...');
    const student1 = await db.collection('students').add({
      full_name: 'Nguyen Van An',
      email: 'an.nguyen@email.com',
      phone: '0912-345-678',
      status: 'active',
      data: {
        date_of_birth: '1995-03-15',
        address: '789 Student Street, District 3, Ho Chi Minh City',
        expected_campus: 'CS1',
        program: 'IELTS Preparation',
        current_english_level: 'Pre-intermediate',
        parent: {
          name: 'Nguyen Van Ba',
          phone: '0913-456-789',
          email: 'ba.nguyen@email.com'
        },
        notes: 'Motivated student, good attendance'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const student2 = await db.collection('students').add({
      full_name: 'Tran Thi Linh',
      email: 'linh.tran@email.com',
      phone: '0987-654-321',
      status: 'active',
      data: {
        date_of_birth: '1998-07-22',
        address: '321 Learning Avenue, District 1, Ho Chi Minh City',
        expected_campus: 'CS1',
        program: 'Business English',
        current_english_level: 'Beginner',
        parent: {
          name: 'Tran Van Duc',
          phone: '0988-765-432',
          email: 'duc.tran@email.com'
        },
        notes: 'Needs extra help with pronunciation'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create sample enrollments
    console.log('📝 Creating sample enrollments...');
    await db.collection('enrollments').add({
      student_id: student1.id,
      class_id: class2.id,
      enrollment_date: '2024-01-20',
      status: 'active',
      data: {
        payment_status: 'paid',
        enrollment_fee: 2500000,
        notes: 'Full payment received'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    await db.collection('enrollments').add({
      student_id: student2.id,
      class_id: class1.id,
      enrollment_date: '2024-01-10',
      status: 'active',
      data: {
        payment_status: 'partial',
        enrollment_fee: 1800000,
        notes: 'Payment plan: 50% paid, remainder due next month'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create sample finances
    console.log('💰 Creating sample financial records...');
    await db.collection('finances').add({
      student_id: student1.id,
      amount: 2500000,
      transaction_type: 'payment',
      transaction_date: '2024-01-20',
      status: 'completed',
      description: 'IELTS Course Enrollment Fee',
      data: {
        payment_method: 'bank_transfer',
        reference_number: 'TXN-2024-001'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    await db.collection('finances').add({
      student_id: student2.id,
      amount: 900000,
      transaction_type: 'payment',
      transaction_date: '2024-01-10',
      status: 'completed',
      description: 'Beginner Course - Partial Payment',
      data: {
        payment_method: 'cash',
        reference_number: 'TXN-2024-002'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ Sample data seeded successfully!');
    console.log('');
    console.log('📋 Sample accounts created:');
    console.log('👤 Admin: admin@merakierp.com / admin123');
    console.log('👨‍🏫 Teacher: teacher@merakierp.com / teacher123');
    console.log('👨‍🎓 Student: student@merakierp.com / student123');
    console.log('');
    console.log('🔗 Access the Firebase Emulator UI at: http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding
seedData().then(() => {
  console.log('🎉 Seeding completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});