const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  try {
    // Test connection first
    console.log('1. Testing connection...');
    const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('relation "students" does not exist')) {
        console.log('\n📝 Tables do not exist. Please run the schema first:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Copy and paste the content from database/schema.sql');
        console.log('3. Run the SQL script');
        console.log('4. Then copy and paste the content from database/security-policies.sql');
        console.log('5. Run the security policies script');
        console.log('6. Run this setup script again\n');
        return;
      }
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔑 API Key issue detected. Please check:');
        console.log('1. Go to Supabase Dashboard > Settings > API');
        console.log('2. Copy the "anon public" key (starts with "eyJ")');
        console.log('3. Update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
        console.log('4. Make sure there are no extra spaces or line breaks\n');
        return;
      }
      
      throw error;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📊 Current students count: ${data || 0}\n`);

    // Check if we need to insert sample data
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id')
      .limit(1);

    if (!existingStudents || existingStudents.length === 0) {
      console.log('2. Inserting sample data...');
      
      // Insert sample facility
      const { data: facility, error: facilityError } = await supabase
        .from('facilities')
        .insert({
          name: 'Main Campus',
          status: 'active',
          data: {
            address: '123 Education Street, Ho Chi Minh City',
            capacity: 500,
            established: '2020-01-01'
          }
        })
        .select()
        .single();

      if (facilityError) {
        console.log('❌ Error inserting facility:', facilityError.message);
        return;
      }

      // Insert sample class
      const { data: sampleClass, error: classError } = await supabase
        .from('classes')
        .insert({
          class_name: 'Beginner English A1',
          facility_id: facility.id,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          data: {
            level: 'A1',
            duration: '3 months',
            schedule: 'Mon, Wed, Fri - 7:00 PM',
            max_students: 20
          }
        })
        .select()
        .single();

      if (classError) {
        console.log('❌ Error inserting class:', classError.message);
        return;
      }

      // Insert sample students
      const sampleStudents = [
        {
          full_name: 'Nguyễn Văn An',
          email: 'nguyen.van.an@email.com',
          phone: '0901234567',
          status: 'active',
          data: {
            date_of_birth: '1995-05-15',
            address: '456 Student Street, District 1, Ho Chi Minh City',
            emergency_contact: {
              name: 'Nguyễn Thị Bình',
              phone: '0907654321',
              relationship: 'Mother'
            },
            english_level: 'Beginner',
            goals: 'Improve speaking skills for work'
          }
        },
        {
          full_name: 'Trần Thị Bình',
          email: 'tran.thi.binh@email.com',
          phone: '0912345678',
          status: 'active',
          data: {
            date_of_birth: '1992-08-22',
            address: '789 Learning Avenue, District 3, Ho Chi Minh City',
            emergency_contact: {
              name: 'Trần Văn Cường',
              phone: '0908765432',
              relationship: 'Husband'
            },
            english_level: 'Intermediate',
            goals: 'Prepare for IELTS exam'
          }
        }
      ];

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .insert(sampleStudents)
        .select();

      if (studentsError) {
        console.log('❌ Error inserting students:', studentsError.message);
        return;
      }

      // Insert sample enrollments
      const enrollments = students.map(student => ({
        student_id: student.id,
        class_id: sampleClass.id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        data: {
          payment_status: 'paid',
          enrollment_fee: 2000000,
          notes: 'Regular enrollment'
        }
      }));

      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (enrollmentError) {
        console.log('❌ Error inserting enrollments:', enrollmentError.message);
        return;
      }

      console.log('✅ Sample data inserted successfully!');
      console.log(`📚 Created ${students.length} students`);
      console.log(`🏫 Created 1 facility and 1 class`);
      console.log(`📝 Created ${enrollments.length} enrollments\n`);
    } else {
      console.log('2. Sample data already exists, skipping insertion...\n');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run dev');
    console.log('3. Open: http://localhost:3000');
    console.log('4. Test the student enrollment form\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has correct values');
    console.log('2. Ensure database schema is created in Supabase');
    console.log('3. Verify API keys are correct');
    console.log('4. Check Supabase project is active\n');
  }
}

setupDatabase();
