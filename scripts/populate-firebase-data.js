const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin for emulator
const app = initializeApp({
  projectId: 'merakierp',
});

const db = getFirestore(app);

// Sample data following the Firebase schema structure
const sampleData = {
  students: [
    {
      id: 'student-001',
      full_name: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      phone: '0901234567',
      status: 'active',
      data: {
        date_of_birth: '2010-05-15',
        address: '123 Nguyễn Trãi, Quận 1, TP.HCM',
        expected_campus: 'CS1',
        program: 'GrapeSEED',
        student_description: 'Học sinh năng động, thích hoạt động nhóm',
        current_english_level: 'Beginner',
        parent: {
          name: 'Nguyễn Thị Lan',
          phone: '0901234567',
          email: 'lan.nguyen@example.com'
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'student-002',
      full_name: 'Trần Thị Bình',
      email: 'binh.tran@example.com',
      phone: '0907654321',
      status: 'active',
      data: {
        date_of_birth: '2011-03-20',
        address: '456 Lê Lợi, Quận 3, TP.HCM',
        expected_campus: 'CS2',
        program: 'Tiếng Anh Tiểu Học',
        student_description: 'Học sinh chăm chỉ, tập trung cao',
        current_english_level: 'Elementary',
        parent: {
          name: 'Trần Văn Dũng',
          phone: '0907654321',
          email: 'dung.tran@example.com'
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'student-003',
      full_name: 'Lê Minh Châu',
      email: 'chau.le@example.com',
      phone: '0912345678',
      status: 'active',
      data: {
        date_of_birth: '2009-08-10',
        address: '789 Điện Biên Phủ, Quận 10, TP.HCM',
        expected_campus: 'CS3',
        program: 'Pre-WSC',
        student_description: 'Học sinh thông minh, có khả năng lãnh đạo',
        current_english_level: 'Intermediate',
        parent: {
          name: 'Lê Thị Mai',
          phone: '0912345678',
          email: 'mai.le@example.com'
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  classes: [
    {
      id: 'class-001',
      class_name: 'GrapeSEED Level 1A',
      facility_id: 'facility-001',
      status: 'active',
      start_date: '2024-01-15',
      data: {
        end_date: '2024-06-15',
        level: 'Beginner',
        max_students: 15,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '16:00-17:30'
        },
        instructor_id: 'employee-001',
        description: 'Lớp GrapeSEED dành cho trẻ em 4-6 tuổi'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'class-002',
      class_name: 'Elementary English 2B',
      facility_id: 'facility-001',
      status: 'active',
      start_date: '2024-02-01',
      data: {
        end_date: '2024-07-01',
        level: 'Elementary',
        max_students: 20,
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '18:00-19:30'
        },
        instructor_id: 'employee-002',
        description: 'Lớp tiếng Anh tiểu học nâng cao'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  facilities: [
    {
      id: 'facility-001',
      name: 'Cơ sở 1 - Quận 1',
      status: 'active',
      data: {
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        capacity: 200,
        contact_info: {
          phone: '028-1234-5678',
          email: 'cs1@merakierp.com'
        },
        amenities: ['Phòng học có điều hòa', 'Máy chiếu', 'Bảng thông minh', 'Thư viện']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'facility-002',
      name: 'Cơ sở 2 - Quận 3',
      status: 'active',
      data: {
        address: '456 Lê Văn Sỹ, Quận 3, TP.HCM',
        capacity: 150,
        contact_info: {
          phone: '028-2345-6789',
          email: 'cs2@merakierp.com'
        },
        amenities: ['Phòng học hiện đại', 'Sân chơi', 'Căng tin']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  employees: [
    {
      id: 'employee-001',
      full_name: 'Ms. Sarah Johnson',
      email: 'sarah.johnson@merakierp.com',
      phone: '0909123456',
      position: 'English Teacher',
      status: 'active',
      data: {
        hire_date: '2023-01-15',
        department: 'Teaching',
        qualifications: ['TESOL Certificate', 'Bachelor in English Literature'],
        experience_years: 5
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'employee-002',
      full_name: 'Thầy Nguyễn Hoàng Nam',
      email: 'nam.nguyen@merakierp.com',
      phone: '0905987654',
      position: 'Vietnamese Teacher',
      status: 'active',
      data: {
        hire_date: '2022-08-01',
        department: 'Teaching',
        qualifications: ['Cử nhân Ngữ văn', 'Chứng chỉ Sư phạm'],
        experience_years: 8
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  enrollments: [
    {
      id: 'enrollment-001',
      student_id: 'student-001',
      class_id: 'class-001',
      enrollment_date: '2024-01-10',
      status: 'active',
      data: {
        payment_status: 'paid',
        enrollment_fee: 2500000,
        notes: 'Học sinh đăng ký từ đầu năm'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'enrollment-002',
      student_id: 'student-002',
      class_id: 'class-002',
      enrollment_date: '2024-01-25',
      status: 'active',
      data: {
        payment_status: 'paid',
        enrollment_fee: 3000000,
        notes: 'Chuyển từ lớp khác'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  finances: [
    {
      id: 'finance-001',
      student_id: 'student-001',
      amount: 2500000,
      transaction_type: 'payment',
      transaction_date: '2024-01-10',
      status: 'completed',
      description: 'Học phí tháng 1-2024',
      data: {
        payment_method: 'bank_transfer',
        invoice_number: 'INV-2024-001'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'finance-002',
      student_id: 'student-002',
      amount: 3000000,
      transaction_type: 'payment',
      transaction_date: '2024-01-25',
      status: 'completed',
      description: 'Học phí tháng 2-2024',
      data: {
        payment_method: 'cash',
        invoice_number: 'INV-2024-002'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

async function populateData() {
  try {
    console.log('🌱 Starting to populate Firebase emulator with sample data...');

    // Connect to emulator
    const { connectFirestoreEmulator } = require('firebase-admin/firestore');
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8088);
      console.log('📡 Connected to Firestore emulator');
    } catch (error) {
      console.log('⚠️ Firestore emulator might already be connected');
    }

    // Populate each collection
    for (const [collectionName, items] of Object.entries(sampleData)) {
      console.log(`📝 Creating ${items.length} items in ${collectionName} collection...`);
      
      const batch = db.batch();
      
      for (const item of items) {
        const docRef = db.collection(collectionName).doc(item.id);
        batch.set(docRef, item);
      }
      
      await batch.commit();
      console.log(`✅ Created ${items.length} ${collectionName} successfully`);
    }

    console.log('🎉 All sample data has been created successfully!');
    console.log('🔗 View the data at: http://127.0.0.1:4020/firestore');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  }
}

// Run the population script
populateData();