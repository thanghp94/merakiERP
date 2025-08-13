const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLessonIdFormat() {
  try {
    console.log('🧪 Testing lesson ID format functionality...');
    
    // First, let's check if we have any classes with current_unit set
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, current_unit, data')
      .limit(5);
    
    if (classError) {
      console.error('Error fetching classes:', classError);
      return;
    }
    
    console.log('\n📋 Available classes:');
    classes.forEach(cls => {
      const currentUnit = cls.current_unit || cls.data?.unit;
      console.log(`- ${cls.class_name}: current_unit=${cls.current_unit}, data.unit=${cls.data?.unit}, effective_unit=${currentUnit}`);
    });
    
    // Check recent main sessions to see the lesson_id format
    const { data: mainSessions, error: sessionError } = await supabase
      .from('main_sessions')
      .select('main_session_name, lesson_id, scheduled_date, classes(class_name, current_unit, data)')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (sessionError) {
      console.error('Error fetching main sessions:', sessionError);
      return;
    }
    
    console.log('\n📚 Recent main sessions and their lesson_id format:');
    mainSessions.forEach(session => {
      const currentUnit = session.classes?.current_unit || session.classes?.data?.unit;
      console.log(`- ${session.main_session_name}`);
      console.log(`  lesson_id: "${session.lesson_id}"`);
      console.log(`  class_unit: ${currentUnit}`);
      console.log(`  date: ${session.scheduled_date}`);
      console.log('');
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLessonIdFormat();
