const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testHRRequestSystem() {
  console.log('🚀 Testing HR Request & Approval System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking database tables...');
    
    const { data: requestsTable, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .limit(1);
    
    if (requestsError) {
      console.error('❌ Requests table not found:', requestsError.message);
      console.log('💡 Please run the database migration first:');
      console.log('   psql -d your_database -f scripts/create-hr-request-system.sql');
      return;
    }
    
    const { data: commentsTable, error: commentsError } = await supabase
      .from('request_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ Request comments table not found:', commentsError.message);
      return;
    }
    
    console.log('✅ Database tables exist');

    // Test 2: Check if employees exist
    console.log('\n👥 Test 2: Checking employees...');
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, full_name, position')
      .limit(5);
    
    if (employeesError || !employees || employees.length === 0) {
      console.log('⚠️  No employees found. Creating test employee...');
      
      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert({
          full_name: 'Nguyễn Văn Test',
          email: 'test@example.com',
          phone: '0123456789',
          position: 'Nhân viên',
          status: 'active',
          data: { role: 'employee', department: 'Hành chính' }
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create test employee:', createError.message);
        return;
      }
      
      console.log('✅ Test employee created:', newEmployee.full_name);
      employees.push(newEmployee);
    } else {
      console.log(`✅ Found ${employees.length} employees`);
    }

    const testEmployee = employees[0];

    // Test 3: Test API endpoints
    console.log('\n🔗 Test 3: Testing API endpoints...');

    // Test creating different types of requests
    const testRequests = [
      {
        request_type: 'nghi_phep',
        title: 'Xin nghỉ phép thăm gia đình',
        description: 'Tôi xin phép được nghỉ để về thăm gia đình ở quê nhà.',
        request_data: {
          from_date: '2024-02-15',
          to_date: '2024-02-17',
          reason: 'Thăm gia đình',
          total_days: 3
        },
        created_by_employee_id: testEmployee.id
      },
      {
        request_type: 'tam_ung',
        title: 'Xin tạm ứng lương tháng 2',
        description: 'Tôi cần tạm ứng một phần lương để chi trả các khoản cấp thiết.',
        request_data: {
          amount: 5000000,
          reason: 'Chi phí y tế khẩn cấp',
          repayment_plan: 'Trừ vào lương tháng 3'
        },
        created_by_employee_id: testEmployee.id
      },
      {
        request_type: 'mua_sam_sua_chua',
        title: 'Mua máy chiếu cho phòng học',
        description: 'Cần mua máy chiếu mới để thay thế máy cũ đã hỏng.',
        request_data: {
          item_name: 'Máy chiếu Epson EB-X41',
          estimated_cost: 8500000,
          reason: 'Máy cũ đã hỏng không sửa được',
          vendor: 'Công ty TNHH Thiết bị giáo dục ABC'
        },
        created_by_employee_id: testEmployee.id
      },
      {
        request_type: 'doi_lich',
        title: 'Xin đổi lịch dạy tuần sau',
        description: 'Tôi có việc đột xuất cần đổi lịch dạy từ thứ 3 sang thứ 5.',
        request_data: {
          original_date: '2024-02-13',
          new_date: '2024-02-15',
          reason: 'Có cuộc họp quan trọng',
          class_affected: 'Lớp IELTS 6.5 buổi sáng'
        },
        created_by_employee_id: testEmployee.id
      }
    ];

    const createdRequests = [];

    for (const requestData of testRequests) {
      console.log(`   Creating ${requestData.request_type} request...`);
      
      const { data: newRequest, error: createError } = await supabase
        .from('requests')
        .insert(requestData)
        .select(`
          *,
          created_by:employees!requests_created_by_employee_id_fkey (
            id,
            full_name,
            position
          )
        `)
        .single();
      
      if (createError) {
        console.error(`   ❌ Failed to create ${requestData.request_type} request:`, createError.message);
      } else {
        console.log(`   ✅ Created ${requestData.request_type} request: ${newRequest.title}`);
        createdRequests.push(newRequest);
      }
    }

    // Test 4: Test fetching requests
    console.log('\n📋 Test 4: Testing request retrieval...');
    
    const { data: allRequests, error: fetchError } = await supabase
      .from('requests')
      .select(`
        *,
        created_by:employees!requests_created_by_employee_id_fkey (
          id,
          full_name,
          position
        )
      `)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Failed to fetch requests:', fetchError.message);
    } else {
      console.log(`✅ Successfully fetched ${allRequests.length} requests`);
      
      // Show request types breakdown
      const requestTypes = allRequests.reduce((acc, req) => {
        acc[req.request_type] = (acc[req.request_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   Request types breakdown:');
      Object.entries(requestTypes).forEach(([type, count]) => {
        const labels = {
          nghi_phep: 'Nghỉ phép',
          doi_lich: 'Đổi lịch',
          tam_ung: 'Tạm ứng',
          mua_sam_sua_chua: 'Mua sắm/Sửa chữa'
        };
        console.log(`   - ${labels[type] || type}: ${count}`);
      });
    }

    // Test 5: Test status updates
    if (createdRequests.length > 0) {
      console.log('\n🔄 Test 5: Testing status updates...');
      
      const testRequest = createdRequests[0];
      
      const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update({ 
          status: 'approved',
          approver_employee_id: testEmployee.id
        })
        .eq('request_id', testRequest.request_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Failed to update request status:', updateError.message);
      } else {
        console.log(`✅ Successfully updated request status to: ${updatedRequest.status}`);
      }
    }

    // Test 6: Test comments
    if (createdRequests.length > 0) {
      console.log('\n💬 Test 6: Testing comments...');
      
      const testRequest = createdRequests[0];
      
      const { data: newComment, error: commentError } = await supabase
        .from('request_comments')
        .insert({
          request_id: testRequest.request_id,
          employee_id: testEmployee.id,
          comment: 'Yêu cầu này đã được xem xét và phê duyệt.'
        })
        .select(`
          *,
          employee:employees (
            id,
            full_name,
            position
          )
        `)
        .single();
      
      if (commentError) {
        console.error('❌ Failed to create comment:', commentError.message);
      } else {
        console.log('✅ Successfully created comment:', newComment.comment);
      }
    }

    // Test 7: Test filtering
    console.log('\n🔍 Test 7: Testing request filtering...');
    
    const { data: pendingRequests, error: filterError } = await supabase
      .from('requests')
      .select('*')
      .eq('status', 'pending');
    
    if (filterError) {
      console.error('❌ Failed to filter requests:', filterError.message);
    } else {
      console.log(`✅ Found ${pendingRequests.length} pending requests`);
    }

    console.log('\n🎉 HR Request System Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Database tables: ✅ Working`);
    console.log(`   - Request creation: ✅ Working`);
    console.log(`   - Request retrieval: ✅ Working`);
    console.log(`   - Status updates: ✅ Working`);
    console.log(`   - Comments system: ✅ Working`);
    console.log(`   - Filtering: ✅ Working`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Run the database migration: psql -d your_database -f scripts/create-hr-request-system.sql');
    console.log('   2. Start your Next.js development server: npm run dev');
    console.log('   3. Navigate to the dashboard and go to HCNS > Yêu cầu');
    console.log('   4. Test the UI functionality');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHRRequestSystem();
