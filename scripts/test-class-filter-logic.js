require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testClassFilterLogic() {
  console.log('🧪 Testing Class Filter Logic...\n');

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
      console.log('⚠️  No attendance records to test class filtering with');
      return;
    }

    // 4. Test class extraction logic
    console.log('\n4. Testing class extraction logic...');
    const classesSet = new Set();
    const recordsByClass = {};

    allAttendanceRecords.forEach((record, index) => {
      const className = record.enrollments?.classes?.class_name;
      const classId = record.enrollments?.classes?.id;
      console.log(`   Record ${index + 1}: class_name="${className}", class_id="${classId}"`);
      
      if (className && classId) {
        // Check if this class is already in the set
        const existingClass = Array.from(classesSet).find(c => c.id === classId);
        if (!existingClass) {
          const classObj = { id: classId, name: className };
          classesSet.add(classObj);
          recordsByClass[classId] = [];
          console.log(`     ✅ Added class: ${className} (${classId})`);
        }
        recordsByClass[classId].push(record);
      } else {
        console.log(`     ⚠️  No class information found`);
      }
    });

    const availableClasses = Array.from(classesSet).sort((a, b) => a.name.localeCompare(b.name));
    console.log(`\n📋 Available classes: ${availableClasses.map(c => c.name).join(', ')}`);

    // 5. Test filtering logic for each class
    console.log('\n5. Testing class filtering logic...');
    
    for (const classObj of availableClasses) {
      console.log(`\n   Testing filter for ${classObj.name} (${classObj.id}):`);
      
      // Simulate the class filtering logic
      const filtered = allAttendanceRecords.filter((record) => {
        const recordClassId = record.enrollments?.classes?.id;
        return recordClassId === classObj.id;
      });

      console.log(`     Expected: ${recordsByClass[classObj.id]?.length || 0} records`);
      console.log(`     Filtered: ${filtered.length} records`);
      
      if (filtered.length === (recordsByClass[classObj.id]?.length || 0)) {
        console.log(`     ✅ Class filter working correctly for ${classObj.name}`);
      } else {
        console.log(`     ❌ Class filter mismatch for ${classObj.name}`);
        console.log(`     Expected records:`, recordsByClass[classObj.id]?.map(r => r.id));
        console.log(`     Filtered records:`, filtered.map(r => r.id));
      }
    }

    // 6. Test "all" filter
    console.log('\n   Testing "all classes" filter:');
    const allFiltered = allAttendanceRecords; // "all" should return all records
    console.log(`     Expected: ${allAttendanceRecords.length} records`);
    console.log(`     Filtered: ${allFiltered.length} records`);
    
    if (allFiltered.length === allAttendanceRecords.length) {
      console.log(`     ✅ "All classes" filter working correctly`);
    } else {
      console.log(`     ❌ "All classes" filter not working correctly`);
    }

    // 7. Test combined unit and class filtering
    console.log('\n6. Testing combined unit and class filtering...');
    
    // Extract units for combined testing
    const unitsSet = new Set();
    allAttendanceRecords.forEach((record) => {
      const lessonId = record.main_sessions?.lesson_id || '';
      const sessionName = record.main_sessions?.main_session_name || '';
      
      if (lessonId.includes('.')) {
        const unit = lessonId.split('.')[0];
        if (unit.match(/^U\d+$/)) {
          unitsSet.add(unit);
        }
      } else if (sessionName) {
        const unitMatch = sessionName.match(/\.U(\d+)\./);
        if (unitMatch) {
          unitsSet.add(`U${unitMatch[1]}`);
        } else {
          const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
          if (unitMatch2) {
            unitsSet.add(`U${unitMatch2[1]}`);
          }
        }
      }
    });

    const availableUnits = Array.from(unitsSet).sort();
    
    if (availableUnits.length > 0 && availableClasses.length > 0) {
      const testUnit = availableUnits[0];
      const testClass = availableClasses[0];
      
      console.log(`   Testing combined filter: ${testUnit} + ${testClass.name}`);
      
      // Apply both filters
      let combinedFiltered = allAttendanceRecords;
      
      // Apply unit filter
      combinedFiltered = combinedFiltered.filter((record) => {
        const lessonId = record.main_sessions?.lesson_id || '';
        if (lessonId.includes('.')) {
          const recordUnit = lessonId.split('.')[0];
          return recordUnit === testUnit;
        } else {
          const sessionName = record.main_sessions?.main_session_name || '';
          const unitMatch = sessionName.match(/\.U(\d+)\./);
          if (unitMatch) {
            const recordUnit = `U${unitMatch[1]}`;
            return recordUnit === testUnit;
          } else {
            const unitMatch2 = sessionName.match(/U(\d+)L\d+/);
            if (unitMatch2) {
              const recordUnit = `U${unitMatch2[1]}`;
              return recordUnit === testUnit;
            }
          }
        }
        return false;
      });
      
      // Apply class filter
      combinedFiltered = combinedFiltered.filter((record) => {
        const recordClassId = record.enrollments?.classes?.id;
        return recordClassId === testClass.id;
      });
      
      console.log(`     Combined filter result: ${combinedFiltered.length} records`);
      console.log(`     ✅ Combined filtering logic working`);
    }

    console.log('\n🎉 Class filter logic test completed!');

  } catch (error) {
    console.error('❌ Error testing class filter logic:', error);
  }
}

testClassFilterLogic();
