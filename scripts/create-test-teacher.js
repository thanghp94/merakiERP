const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestTeacher() {
  console.log('🔍 Checking existing employees...');
  
  const { data: employees } = await supabase
    .from('employees')
    .select('id, full_name, position');
  
  console.log('Existing employees:', employees);
  
  // Check if we have any teachers
  const teachers = employees?.filter(emp => 
    emp.position?.toLowerCase().includes('teacher') || 
    emp.position?.toLowerCase().includes('giáo viên')
  );
  
  if (!teachers || teachers.length === 0) {
    console.log('📝 Creating a test teacher...');
    const { data: newTeacher, error } = await supabase
      .from('employees')
      .insert({
        full_name: 'Hussam Test Teacher',
        email: 'hussam@test.com',
        position: 'teacher',
        phone: '0123456789'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating teacher:', error);
    } else {
      console.log('✅ Created teacher:', newTeacher);
    }
  } else {
    console.log('✅ Teachers already exist:', teachers);
  }
}

createTestTeacher();
