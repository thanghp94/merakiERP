const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClassesCRUD() {
  console.log('🧪 Testing Classes CRUD Operations...\n');

  let testClassId = null;

  try {
    // 1. Test CREATE
    console.log('1. Testing CREATE class...');
    const createData = {
      class_name: 'Test Class CRUD',
      facility_id: null,
      status: 'active',
      start_date: '2025-01-15',
      data: {
        program_type: 'GrapeSEED',
        unit: 'U1',
        duration: '3 months',
        schedule: 'Mon, Wed, Fri - 19:00-21:00',
        max_students: 15,
        description: 'Test class for CRUD operations'
      }
    };

    const { data: newClass, error: createError } = await supabase
      .from('classes')
      .insert(createData)
      .select('*')
      .single();

    if (createError) {
      console.error('❌ CREATE failed:', createError);
      return;
    }

    testClassId = newClass.id;
    console.log('✅ CREATE successful:', newClass.class_name);

    // 2. Test READ
    console.log('\n2. Testing READ class...');
    const { data: readClass, error: readError } = await supabase
      .from('classes')
      .select(`
        *,
        facilities (
          id,
          name,
          status
        )
      `)
      .eq('id', testClassId)
      .single();

    if (readError) {
      console.error('❌ READ failed:', readError);
      return;
    }

    console.log('✅ READ successful:', readClass.class_name);

    // 3. Test UPDATE
    console.log('\n3. Testing UPDATE class...');
    const updateData = {
      class_name: 'Updated Test Class CRUD',
      status: 'inactive',
      data: {
        ...readClass.data,
        description: 'Updated test class description',
        max_students: 20
      }
    };

    const { data: updatedClass, error: updateError } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', testClassId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ UPDATE failed:', updateError);
      return;
    }

    console.log('✅ UPDATE successful:', updatedClass.class_name);
    console.log('   Status changed to:', updatedClass.status);
    console.log('   Max students changed to:', updatedClass.data.max_students);

    // 4. Test LIST with filters
    console.log('\n4. Testing LIST classes with filters...');
    const { data: classList, error: listError } = await supabase
      .from('classes')
      .select(`
        *,
        facilities (
          id,
          name,
          status
        )
      `)
      .eq('status', 'inactive')
      .order('created_at', { ascending: false })
      .limit(10);

    if (listError) {
      console.error('❌ LIST failed:', listError);
      return;
    }

    console.log('✅ LIST successful:', classList.length, 'inactive classes found');

    // 5. Test DELETE
    console.log('\n5. Testing DELETE class...');
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', testClassId);

    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError);
      return;
    }

    console.log('✅ DELETE successful');

    // 6. Verify deletion
    console.log('\n6. Verifying deletion...');
    const { data: deletedClass, error: verifyError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', testClassId)
      .single();

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ Deletion verified - class not found');
    } else {
      console.error('❌ Deletion verification failed - class still exists');
    }

    console.log('\n🎉 All CRUD operations completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    // Cleanup in case of error
    if (testClassId) {
      console.log('\n🧹 Cleaning up test data...');
      await supabase
        .from('classes')
        .delete()
        .eq('id', testClassId);
    }
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test GET /api/classes
    console.log('1. Testing GET /api/classes...');
    const getResponse = await fetch(`${baseUrl}/api/classes`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('✅ GET /api/classes successful:', getResult.data.length, 'classes found');
    } else {
      console.error('❌ GET /api/classes failed:', getResult.message);
    }

    // Test POST /api/classes
    console.log('\n2. Testing POST /api/classes...');
    const postData = {
      class_name: 'API Test Class',
      facility_id: null,
      status: 'active',
      start_date: '2025-01-15',
      data: {
        program_type: 'GrapeSEED',
        unit: 'U2',
        duration: '4 months',
        schedule: 'Tue, Thu - 18:00-20:00',
        max_students: 12,
        description: 'Test class via API'
      }
    };

    const postResponse = await fetch(`${baseUrl}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    const postResult = await postResponse.json();
    
    if (postResult.success) {
      console.log('✅ POST /api/classes successful:', postResult.data.class_name);
      
      const testClassId = postResult.data.id;

      // Test GET /api/classes/[id]
      console.log('\n3. Testing GET /api/classes/[id]...');
      const getByIdResponse = await fetch(`${baseUrl}/api/classes/${testClassId}`);
      const getByIdResult = await getByIdResponse.json();
      
      if (getByIdResult.success) {
        console.log('✅ GET /api/classes/[id] successful:', getByIdResult.data.class_name);
      } else {
        console.error('❌ GET /api/classes/[id] failed:', getByIdResult.message);
      }

      // Test PUT /api/classes/[id]
      console.log('\n4. Testing PUT /api/classes/[id]...');
      const putData = {
        class_name: 'Updated API Test Class',
        status: 'inactive',
        data: {
          ...postResult.data.data,
          description: 'Updated via API',
          max_students: 18
        }
      };

      const putResponse = await fetch(`${baseUrl}/api/classes/${testClassId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData),
      });

      const putResult = await putResponse.json();
      
      if (putResult.success) {
        console.log('✅ PUT /api/classes/[id] successful:', putResult.data.class_name);
      } else {
        console.error('❌ PUT /api/classes/[id] failed:', putResult.message);
      }

      // Test DELETE /api/classes/[id]
      console.log('\n5. Testing DELETE /api/classes/[id]...');
      const deleteResponse = await fetch(`${baseUrl}/api/classes/${testClassId}`, {
        method: 'DELETE',
      });

      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.success) {
        console.log('✅ DELETE /api/classes/[id] successful');
      } else {
        console.error('❌ DELETE /api/classes/[id] failed:', deleteResult.message);
      }

    } else {
      console.error('❌ POST /api/classes failed:', postResult.message);
    }

    console.log('\n🎉 All API endpoint tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Classes CRUD Tests\n');
  
  // Test direct database operations
  await testClassesCRUD();
  
  // Test API endpoints
  await testAPIEndpoints();
  
  console.log('\n✨ All tests completed!');
}

main().catch(console.error);
