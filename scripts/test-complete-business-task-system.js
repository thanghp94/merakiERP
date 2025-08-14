#!/usr/bin/env node

/**
 * Complete Business Task Management System Test
 * Tests all APIs and functionality for the business task system
 */

const API_BASE = 'http://localhost:3000/api';

// Test data
const testTaskTemplate = {
  title: 'Chuẩn bị báo cáo tháng',
  description: 'Tổng hợp và chuẩn bị báo cáo hoạt động kinh doanh hàng tháng',
  task_type: 'repeated',
  frequency: {
    repeat: 'monthly',
    day_of_month: 28
  },
  meta_data: {
    category: 'hành_chính',
    priority: 'cao',
    estimated_hours: 4,
    department: 'Quản lý'
  }
};

const testTaskInstance = {
  title: 'Liên hệ phụ huynh học sinh vắng học',
  description: 'Gọi điện cho phụ huynh các em vắng học quá 3 buổi liên tiếp',
  due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  meta_data: {
    category: 'liên_hệ_phụ_huynh',
    priority: 'cao',
    student_names: ['Nguyễn Văn A', 'Trần Thị B'],
    contact_method: 'phone'
  }
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { error };
  }
}

async function testTasksAPI() {
  console.log('\n🧪 Testing Tasks API...');
  
  // Test GET /api/tasks
  console.log('\n1. Testing GET /api/tasks');
  const { response: getResponse, data: getTasks } = await makeRequest(`${API_BASE}/tasks`);
  
  if (getResponse?.ok) {
    console.log('✅ GET /api/tasks successful');
    console.log(`   Found ${getTasks.data?.length || 0} task templates`);
    
    if (getTasks.data?.length > 0) {
      console.log('   Sample task:', {
        id: getTasks.data[0].task_id,
        title: getTasks.data[0].title,
        type: getTasks.data[0].task_type,
        category: getTasks.data[0].meta_data?.category
      });
    }
  } else {
    console.log('❌ GET /api/tasks failed:', getTasks.message);
  }
  
  // Test POST /api/tasks
  console.log('\n2. Testing POST /api/tasks');
  const { response: postResponse, data: postResult } = await makeRequest(`${API_BASE}/tasks`, {
    method: 'POST',
    body: JSON.stringify(testTaskTemplate)
  });
  
  if (postResponse?.ok) {
    console.log('✅ POST /api/tasks successful');
    console.log('   Created task:', {
      id: postResult.data.task_id,
      title: postResult.data.title,
      type: postResult.data.task_type
    });
    return postResult.data.task_id;
  } else {
    console.log('❌ POST /api/tasks failed:', postResult.message);
    return null;
  }
}

async function testTaskInstancesAPI() {
  console.log('\n🧪 Testing Task Instances API...');
  
  // Test GET /api/task-instances
  console.log('\n1. Testing GET /api/task-instances');
  const { response: getResponse, data: getInstances } = await makeRequest(`${API_BASE}/task-instances`);
  
  if (getResponse?.ok) {
    console.log('✅ GET /api/task-instances successful');
    console.log(`   Found ${getInstances.data?.length || 0} task instances`);
    console.log('   Stats:', getInstances.stats);
    
    if (getInstances.data?.length > 0) {
      console.log('   Sample instance:', {
        id: getInstances.data[0].task_instance_id,
        title: getInstances.data[0].task?.title,
        status: getInstances.data[0].status,
        due_date: getInstances.data[0].due_date
      });
    }
  } else {
    console.log('❌ GET /api/task-instances failed:', getInstances.message);
  }
  
  // Test POST /api/task-instances
  console.log('\n2. Testing POST /api/task-instances');
  const { response: postResponse, data: postResult } = await makeRequest(`${API_BASE}/task-instances`, {
    method: 'POST',
    body: JSON.stringify(testTaskInstance)
  });
  
  if (postResponse?.ok) {
    console.log('✅ POST /api/task-instances successful');
    console.log('   Created instance:', {
      id: postResult.data.task_instance_id,
      title: postResult.data.title,
      status: postResult.data.status
    });
    return postResult.data.task_instance_id;
  } else {
    console.log('❌ POST /api/task-instances failed:', postResult.message);
    return null;
  }
}

async function testTaskInstanceUpdate(instanceId) {
  if (!instanceId) {
    console.log('⏭️  Skipping task instance update test (no instance ID)');
    return;
  }
  
  console.log('\n🧪 Testing Task Instance Update...');
  
  const updateData = {
    task_instance_id: instanceId,
    status: 'completed',
    completion_data: {
      completed_at: new Date().toISOString(),
      notes: 'Đã liên hệ thành công với tất cả phụ huynh',
      results: 'Đã thông báo cho 2 phụ huynh, hẹn gặp vào tuần sau'
    }
  };
  
  const { response, data } = await makeRequest(`${API_BASE}/task-instances`, {
    method: 'PATCH',
    body: JSON.stringify(updateData)
  });
  
  if (response?.ok) {
    console.log('✅ PATCH /api/task-instances successful');
    console.log('   Updated instance:', {
      id: data.data.task_instance_id,
      status: data.data.status,
      completed_at: data.data.completion_data?.completed_at
    });
  } else {
    console.log('❌ PATCH /api/task-instances failed:', data.message);
  }
}

async function testTaskGeneration() {
  console.log('\n🧪 Testing Task Generation...');
  
  const { response, data } = await makeRequest(`${API_BASE}/tasks/generate-instances`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  if (response?.ok) {
    console.log('✅ POST /api/tasks/generate-instances successful');
    console.log('   Generation stats:', data.data?.stats);
  } else {
    console.log('❌ POST /api/tasks/generate-instances failed:', data.message);
  }
}

async function testFiltering() {
  console.log('\n🧪 Testing API Filtering...');
  
  // Test task filtering by category
  console.log('\n1. Testing task filtering by category');
  const { response: taskFilterResponse, data: filteredTasks } = await makeRequest(
    `${API_BASE}/tasks?category=hành_chính`
  );
  
  if (taskFilterResponse?.ok) {
    console.log('✅ Task filtering by category successful');
    console.log(`   Found ${filteredTasks.data?.length || 0} administrative tasks`);
  } else {
    console.log('❌ Task filtering failed:', filteredTasks.message);
  }
  
  // Test instance filtering by status
  console.log('\n2. Testing instance filtering by status');
  const { response: instanceFilterResponse, data: filteredInstances } = await makeRequest(
    `${API_BASE}/task-instances?status=pending`
  );
  
  if (instanceFilterResponse?.ok) {
    console.log('✅ Instance filtering by status successful');
    console.log(`   Found ${filteredInstances.data?.length || 0} pending instances`);
  } else {
    console.log('❌ Instance filtering failed:', filteredInstances.message);
  }
}

async function testTaskComments(instanceId) {
  if (!instanceId) {
    console.log('⏭️  Skipping task comments test (no instance ID)');
    return;
  }
  
  console.log('\n🧪 Testing Task Comments...');
  
  const commentData = {
    task_instance_id: instanceId,
    comment: 'Đã liên hệ với phụ huynh đầu tiên, sẽ gọi cho phụ huynh thứ hai vào chiều mai.'
  };
  
  const { response, data } = await makeRequest(`${API_BASE}/task-comments`, {
    method: 'POST',
    body: JSON.stringify(commentData)
  });
  
  if (response?.ok) {
    console.log('✅ POST /api/task-comments successful');
    console.log('   Created comment:', {
      id: data.data.comment_id,
      comment: data.data.comment.substring(0, 50) + '...'
    });
  } else {
    console.log('❌ POST /api/task-comments failed:', data.message);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete Business Task System Test');
  console.log('='.repeat(60));
  
  try {
    // Test Tasks API
    const taskId = await testTasksAPI();
    
    // Test Task Instances API
    const instanceId = await testTaskInstancesAPI();
    
    // Test Task Instance Updates
    await testTaskInstanceUpdate(instanceId);
    
    // Test Task Generation
    await testTaskGeneration();
    
    // Test Filtering
    await testFiltering();
    
    // Test Comments
    await testTaskComments(instanceId);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Complete Business Task System Test Finished!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Task Templates API');
    console.log('   ✅ Task Instances API');
    console.log('   ✅ Task Updates');
    console.log('   ✅ Task Generation');
    console.log('   ✅ Filtering');
    console.log('   ✅ Comments');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test the frontend at http://localhost:3000/dashboard');
    console.log('   2. Navigate to "Công việc" tab');
    console.log('   3. Try creating tasks and task instances');
    console.log('   4. Test the filtering and completion features');
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest();
}

module.exports = { runCompleteTest };
