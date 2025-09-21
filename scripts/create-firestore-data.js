#!/usr/bin/env node

const https = require('https');

const PROJECT_ID = 'merakierp';
const API_KEY = 'AIzaSyD988kulFWN3ixpCqcUHexgDe7GKSQJReQ';

function createDocument(collection, documentId, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fields: convertToFirestoreFormat(data)
    });

    const url = documentId 
      ? `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${documentId}?key=${API_KEY}`
      : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?key=${API_KEY}`;

    const options = {
      method: documentId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

function convertToFirestoreFormat(obj) {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      result[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = { mapValue: { fields: convertToFirestoreFormat(value) } };
    } else if (Array.isArray(value)) {
      result[key] = { 
        arrayValue: { 
          values: value.map(item => 
            typeof item === 'string' ? { stringValue: item } : 
            typeof item === 'number' ? { doubleValue: item } :
            { stringValue: String(item) }
          )
        }
      };
    } else {
      result[key] = { stringValue: String(value) };
    }
  }
  
  return result;
}

async function createSampleData() {
  try {
    console.log('🌱 Creating sample collections and data in Firestore...');
    
    // Create facilities
    console.log('🏢 Creating facilities...');
    const facility1 = await createDocument('facilities', null, {
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
    
    const facility2 = await createDocument('facilities', null, {
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
    
    console.log('✅ Facilities created');
    
    // Create employees
    console.log('👨‍🏫 Creating employees...');
    const employee1 = await createDocument('employees', null, {
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
    
    console.log('✅ Employees created');
    
    // Create students
    console.log('👨‍🎓 Creating students...');
    const student1 = await createDocument('students', null, {
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
    
    const student2 = await createDocument('students', null, {
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
    
    console.log('✅ Students created');
    
    // Create classes
    console.log('📚 Creating classes...');
    await createDocument('classes', null, {
      class_name: 'English Beginner A1 - Morning',
      facility_id: 'facility_1',
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
        instructor_id: 'employee_1',
        description: 'Basic English for absolute beginners'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    await createDocument('classes', null, {
      class_name: 'IELTS Preparation - Evening',
      facility_id: 'facility_1',
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
        instructor_id: 'employee_1',
        description: 'IELTS test preparation course'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ Classes created');
    
    // Create enrollments
    console.log('📝 Creating enrollments...');
    await createDocument('enrollments', null, {
      student_id: 'student_1',
      class_id: 'class_1',
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
    
    await createDocument('enrollments', null, {
      student_id: 'student_2',
      class_id: 'class_2',
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
    
    console.log('✅ Enrollments created');
    
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
    console.error('❌ Error creating sample data:', error.message);
  }
}

// Run the script
createSampleData();