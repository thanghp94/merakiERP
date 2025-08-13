const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSampleStudents() {
  console.log('🔄 Creating sample students...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Sample students data
  const sampleStudents = [
    {
      full_name: 'Nguyễn Văn An',
      email: 'nguyen.van.an@example.com',
      phone: '0901234567',
      status: 'active',
      data: {
        parent: {
          name: 'Nguyễn Thị Bình',
          phone: '0901234568'
        },
        current_english_level: 'Beginner',
        expected_campus: 'Cơ sở 1',
        program: 'GrapeSEED',
        notes: 'Học sinh mới, cần hỗ trợ thêm'
      }
    },
    {
      full_name: 'Trần Thị Bảo',
      email: 'tran.thi.bao@example.com',
      phone: '0902345678',
      status: 'active',
      data: {
        parent: {
          name: 'Trần Văn Cường',
          phone: '0902345679'
        },
        current_english_level: 'Intermediate',
        expected_campus: 'Cơ sở 2',
        program: 'Pre-WSC',
        notes: 'Học sinh tích cực'
      }
    },
    {
      full_name: 'Lê Minh Đức',
      email: 'le.minh.duc@example.com',
      phone: '0903456789',
      status: 'active',
      data: {
        parent: {
          name: 'Lê Thị Hoa',
          phone: '0903456780'
        },
        current_english_level: 'Advanced',
        expected_campus: 'Cơ sở 1',
        program: 'WSC',
        notes: 'Học sinh giỏi, có thể tham gia các hoạt động nâng cao'
      }
    }
  ];
  
  try {
    // First, check if students already exist
    const { data: existingStudents, error: checkError } = await supabase
      .from('students')
      .select('email');
    
    if (checkError) {
      console.log('❌ Error checking existing students:', checkError.message);
      return;
    }
    
    const existingEmails = existingStudents?.map(s => s.email) || [];
    const newStudents = sampleStudents.filter(s => !existingEmails.includes(s.email));
    
    if (newStudents.length === 0) {
      console.log('✅ Sample students already exist');
      console.log(`📊 Total students in database: ${existingStudents?.length || 0}`);
      return;
    }
    
    // Insert new students
    const { data: insertedStudents, error: insertError } = await supabase
      .from('students')
      .insert(newStudents)
      .select();
    
    if (insertError) {
      console.log('❌ Error creating students:', insertError.message);
      console.log('Error details:', insertError);
      return;
    }
    
    console.log(`✅ Created ${insertedStudents?.length || 0} new students`);
    console.log('Sample students:', insertedStudents?.map(s => s.full_name));
    
    // Test fetching students
    console.log('\n🔍 Testing students fetch...');
    const { data: allStudents, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Error fetching students:', fetchError.message);
    } else {
      console.log(`✅ Successfully fetched ${allStudents?.length || 0} students`);
      allStudents?.forEach(student => {
        console.log(`- ${student.full_name} (${student.email})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

createSampleStudents().catch(console.error);
