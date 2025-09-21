#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

console.log('🌱 Creating Firestore collections and sample data...');

// Firebase configuration for production
const firebaseConfig = {
  apiKey: "AIzaSyDVL3rGq3FdGbWz8QzHb8c6q1N_example", // You'll need to replace this
  authDomain: "merakierp.firebaseapp.com",
  projectId: "merakierp",
  storageBucket: "merakierp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:example"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createCollectionsAndData() {
  try {
    console.log('📊 Creating sample data in production Firestore...');
    
    // Create facilities
    console.log('🏢 Creating facilities...');
    const facility1Ref = await addDoc(collection(db, 'facilities'), {
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
    
    const facility2Ref = await addDoc(collection(db, 'facilities'), {
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
    
    // Create employees
    console.log('👨‍🏫 Creating employees...');
    const employee1Ref = await addDoc(collection(db, 'employees'), {
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
    
    // Create classes
    console.log('📚 Creating classes...');
    const class1Ref = await addDoc(collection(db, 'classes'), {
      class_name: 'English Beginner A1 - Morning',
      facility_id: facility1Ref.id,
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
        instructor_id: employee1Ref.id,
        description: 'Basic English for absolute beginners'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    const class2Ref = await addDoc(collection(db, 'classes'), {
      class_name: 'IELTS Preparation - Evening',
      facility_id: facility1Ref.id,
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
        instructor_id: employee1Ref.id,
        description: 'IELTS test preparation course'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Create students
    console.log('👨‍🎓 Creating students...');
    const student1Ref = await addDoc(collection(db, 'students'), {
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
    
    const student2Ref = await addDoc(collection(db, 'students'), {
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
    
    // Create enrollments
    console.log('📝 Creating enrollments...');
    await addDoc(collection(db, 'enrollments'), {
      student_id: student1Ref.id,
      class_id: class2Ref.id,
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
    
    await addDoc(collection(db, 'enrollments'), {
      student_id: student2Ref.id,
      class_id: class1Ref.id,
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
    
    // Create finances
    console.log('💰 Creating financial records...');
    await addDoc(collection(db, 'finances'), {
      student_id: student1Ref.id,
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
    
    await addDoc(collection(db, 'finances'), {
      student_id: student2Ref.id,
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
    
    console.log('✅ Collections and sample data created successfully!');
    console.log('');
    console.log('📋 Collections created:');
    console.log('🏢 facilities - 2 documents');
    console.log('👨‍🏫 employees - 1 document');
    console.log('📚 classes - 2 documents');
    console.log('👨‍🎓 students - 2 documents');
    console.log('📝 enrollments - 2 documents');
    console.log('💰 finances - 2 documents');
    console.log('');
    console.log('🔗 View your data in Firebase Console:');
    console.log('https://console.firebase.google.com/project/merakierp/firestore');
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
  }
}

// Run the creation
createCollectionsAndData().then(() => {
  console.log('🎉 Collection creation completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Collection creation failed:', error);
  process.exit(1);
});