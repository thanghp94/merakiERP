const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixExistingLessonIds() {
  console.log('🔧 Fixing existing main sessions lesson_id values...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get all main sessions that need fixing
    console.log('📋 Fetching main sessions with missing lesson_id...');
    
    const { data: mainSessions, error } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, lesson_id')
      .is('lesson_id', null);
    
    if (error) {
      console.error('❌ Error fetching main sessions:', error);
      return;
    }
    
    console.log(`✅ Found ${mainSessions?.length || 0} main sessions to fix`);
    
    if (!mainSessions || mainSessions.length === 0) {
      console.log('✅ No main sessions need fixing!');
      return;
    }
    
    // Fix each main session
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const session of mainSessions) {
      console.log(`\n🔧 Processing: ${session.main_session_name}`);
      
      // Extract lesson number from name
      const lessonMatch = session.main_session_name.match(/\.L(\d+)/);
      
      if (lessonMatch) {
        const lessonId = `L${lessonMatch[1]}`;
        console.log(`   Extracted lesson ID: ${lessonId}`);
        
        // Update the main session
        const { error: updateError } = await supabase
          .from('main_sessions')
          .update({ lesson_id: lessonId })
          .eq('main_session_id', session.main_session_id);
        
        if (updateError) {
          console.error(`   ❌ Error updating: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully`);
          fixedCount++;
        }
      } else {
        console.log(`   ⚠️  Could not extract lesson number from name`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} main sessions`);
    console.log(`   ⚠️  Skipped: ${skippedCount} main sessions`);
    
    // Verify the fixes
    console.log(`\n🔍 Verifying fixes...`);
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, lesson_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying fixes:', verifyError);
      return;
    }
    
    console.log('\nUpdated main sessions:');
    verifyData?.forEach((session, index) => {
      console.log(`${index + 1}. ${session.main_session_name}`);
      console.log(`   Lesson ID: ${session.lesson_id || 'NOT SET ❌'}`);
    });
    
    console.log('\n✅ Fix process complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixExistingLessonIds();
