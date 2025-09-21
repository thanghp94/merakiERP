import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

async function createSampleData() {
  try {
    console.log('🌱 Creating sample collections and data...');
    
    // Create facilities
    console.log('🏢 Creating facilities...');
    const facility1 = await addDoc(collection(db, 'facilities'), {
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
    
    const facility2 = await addDoc(collection(db, 'facilities'), {
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
    
    console.log('✅ Facility 1 ID:', facility1.id);
    console.log('✅ Facility 2 ID:', facility2.id);
    
    // Create employees
    console.log('👨‍🏫 Creating employees...');
    const employee1 = await addDoc(collection(db, 'employees'), {
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
    
    console.log('✅ Employee 1 ID:', employee1.id);
    
    // Create classes
    console.log('📚 Creating classes...');
    const class1 = await addDoc(collection(db, 'classes'), {
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
    
    const class2 = await addDoc(collection(db, 'classes'), {
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
    
    console.log('✅ Class 1 ID:', class1.id);
    console.log('✅ Class 2 ID:', class2.id);
    
    // Create students
    console.log('👨‍🎓 Creating students...');
    const student1 = await addDoc(collection(db, 'students'), {
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
    
    const student2 = await addDoc(collection(db, 'students'), {
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
    
    console.log('✅ Student 1 ID:', student1.id);
    console.log('✅ Student 2 ID:', student2.id);
    
    // Create enrollments
    console.log('📝 Creating enrollments...');
    const enrollment1 = await addDoc(collection(db, 'enrollments'), {
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
    
    const enrollment2 = await addDoc(collection(db, 'enrollments'), {
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
    
    console.log('✅ Enrollment 1 ID:', enrollment1.id);
    console.log('✅ Enrollment 2 ID:', enrollment2.id);
    
    console.log('🎉 All sample data created successfully!');
    console.log('');
    console.log('📋 Collections created:');
    console.log('🏢 facilities - 2 documents');
    console.log('👨‍🏫 employees - 1 document');
    console.log('📚 classes - 2 documents');
    console.log('👨‍🎓 students - 2 documents');
    console.log('📝 enrollments - 2 documents');
    console.log('');
    console.log('🔗 View your data in Firebase Console:');
    console.log('https://console.firebase.google.com/project/merakierp/firestore');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Call the function
createSampleData();