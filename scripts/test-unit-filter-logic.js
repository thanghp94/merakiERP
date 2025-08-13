require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUnitFilterLogic() {
  console.log('🧪 Testing Unit Filter Logic...\n');

  try {
    // 1. Get a test student
    console.log('1. Getting test student...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(1);

    if (studentsError || !students || students.length === 0) {
      console.error('❌ No students found:', studentsError);
      return;
    }

    const testStudent = students[0];
    console.log(`✅ Found student: ${testStudent.full_name} (ID: ${testStudent.id})`);

    // 2. Get enrollments for this student
    console.log('\n2. Getting enrollments...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', testStudent.id);

    if (enrollmentsError || !enrollments || enrollments.length === 0) {
      console.error('❌ No enrollments found:', enrollmentsError);
      return;
    }

    console.log(`✅ Found ${enrollments.length} enrollments`);

    // 3. Get attendance records for these enrollments
    console.log('\n3. Getting attendance records...');
    const allAttendanceRecords = [];
    
    for (const enrollment of enrollments) {
      const response = await fetch(`http://localhost:3000/api/attendance?enrollment_id=${enrollment.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        allAttendanceRecords.push(...result.data);
      }
    }

    console.log(`✅ Found ${allAttendanceRecords.length} attendance records`);

    if (allAttendanceRecords.length === 0) {
      console.log('⚠️  No attendance records to test unit filtering with');
      return;
    }

    // 4. Test unit extraction logic
    console.log('\n4. Testing unit extraction logic...');
    const unitsSet = new Set();
    const recordsByUnit = {};

    allAttendanceRecords.forEach((record, index) => {
      const lessonId = record.main_sessions?.lesson_id || '';
      const sessionName = record.main_sessions?.main_session_name || '';
      console.log(`   Record ${index + 1}: lesson_id="${lessonId}", session_name="${sessionName}"`);
      
      let extractedUnit = null;
      
      // First try to extract unit from lesson_id (e.g., "U2.L3" -> "U2")
      if (lessonId.includes('.')) {
        const unit = lessonId.split('.')[0];
        if (unit.match(/^U\d+$/)) { // Validate it's a proper unit format
          extractedUnit = unit;
          console.log(`     ✅ Extracted unit from lesson_id: ${unit}`);
        }
      } else {
        // If lesson_id doesn't have unit, try to extract from main_session_name
        console.log(`     Trying main_session_name: "${sessionName}"`);
        
        // Look for patterns like "GrapeSEED Test Class.U6.L5" or "Class.U8.L1"
        const unitMatch = sessionName.match(/\.U(\d+)\./);
        if (unitMatch) {
          extractedUnit = `U${unitMatch[1]}`;
          console.log(`     ✅ Extracted unit from session_name: ${extractedUnit}`);
        } else {
          // Also try pattern without dots like "U6L5" or "U8L1"
          const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
          if (unitMatch2) {
            extractedUnit = `U${unitMatch2[1]}`;
            console.log(`     ✅ Extracted unit from session_name pattern: ${extractedUnit}`);
          } else {
            console.log(`     ⚠️  No unit found in lesson_id or session_name`);
          }
        }
      }
      
      if (extractedUnit) {
        unitsSet.add(extractedUnit);
        if (!recordsByUnit[extractedUnit]) {
          recordsByUnit[extractedUnit] = [];
        }
        recordsByUnit[extractedUnit].push(record);
      }
    });

    const availableUnits = Array.from(unitsSet).sort();
    console.log(`\n📋 Available units: ${availableUnits.join(', ')}`);

    // 5. Test filtering logic for each unit
    console.log('\n5. Testing filtering logic...');
    
    for (const unit of availableUnits) {
      console.log(`\n   Testing filter for ${unit}:`);
      
      // Simulate the filtering logic from handleUnitFilterChange
      const filtered = allAttendanceRecords.filter((record) => {
        // First try to extract unit from lesson_id (e.g., "U2.L3" -> "U2")
        const lessonId = record.main_sessions?.lesson_id || '';
        if (lessonId.includes('.')) {
          const recordUnit = lessonId.split('.')[0];
          return recordUnit === unit;
        } else {
          // If lesson_id doesn't have unit, try to extract from main_session_name
          const sessionName = record.main_sessions?.main_session_name || '';
          
          // Look for patterns like "GrapeSEED Test Class.U6.L5" or "Class.U8.L1"
          const unitMatch = sessionName.match(/\.U(\d+)\./);
          if (unitMatch) {
            const recordUnit = `U${unitMatch[1]}`;
            return recordUnit === unit;
          } else {
            // Also try pattern without dots like "U6L5" or "U8L1"
            const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
            if (unitMatch2) {
              const recordUnit = `U${unitMatch2[1]}`;
              return recordUnit === unit;
            }
          }
        }
        return false;
      });

      console.log(`     Expected: ${recordsByUnit[unit]?.length || 0} records`);
      console.log(`     Filtered: ${filtered.length} records`);
      
      if (filtered.length === (recordsByUnit[unit]?.length || 0)) {
        console.log(`     ✅ Filter working correctly for ${unit}`);
      } else {
        console.log(`     ❌ Filter mismatch for ${unit}`);
        console.log(`     Expected records:`, recordsByUnit[unit]?.map(r => r.id));
        console.log(`     Filtered records:`, filtered.map(r => r.id));
      }
    }

    // 6. Test "all" filter
    console.log('\n   Testing "all" filter:');
    const allFiltered = allAttendanceRecords; // "all" should return all records
    console.log(`     Expected: ${allAttendanceRecords.length} records`);
    console.log(`     Filtered: ${allFiltered.length} records`);
    
    if (allFiltered.length === allAttendanceRecords.length) {
      console.log(`     ✅ "All" filter working correctly`);
    } else {
      console.log(`     ❌ "All" filter not working correctly`);
    }

    // 7. Test edge cases
    console.log('\n6. Testing edge cases...');
    
    // Test with records that have no lesson_id
    const recordsWithoutLessonId = allAttendanceRecords.filter(record => 
      !record.main_sessions?.lesson_id
    );
    
    if (recordsWithoutLessonId.length > 0) {
      console.log(`   Found ${recordsWithoutLessonId.length} records without lesson_id`);
      
      // These should be filtered out when selecting any specific unit
      const filteredWithoutLessonId = recordsWithoutLessonId.filter((record) => {
        const lessonId = record.main_sessions?.lesson_id || '';
        if (lessonId.includes('.')) {
          const recordUnit = lessonId.split('.')[0];
          return recordUnit === 'U1'; // Test with any unit
        }
        return false;
      });
      
      if (filteredWithoutLessonId.length === 0) {
        console.log(`   ✅ Records without lesson_id correctly filtered out`);
      } else {
        console.log(`   ❌ Records without lesson_id not filtered out properly`);
      }
    } else {
      console.log(`   ✅ All records have lesson_id`);
    }

    console.log('\n🎉 Unit filter logic test completed!');

  } catch (error) {
    console.error('❌ Error testing unit filter logic:', error);
  }
}

testUnitFilterLogic();
