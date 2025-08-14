// Test configuration - Direct API testing without Supabase client
const BASE_URL = 'http://localhost:3000';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test data storage
let createdTaskId = null;
let createdRequestId = null;
let createdEmployeeRequestId = null;
let testEmployeeId = 'test-employee-123';
let testClassId = 'test-class-123';

// Helper function to make HTTP requests
async function makeRequest(method, url, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 500,
      data: { error: error.message },
      success: false
    };
  }
}

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

// Setup test data
async function setupTestData() {
  console.log('\n🔧 Setting up test data...');
  
  // Try to get a real employee ID from the database
  try {
    const employeesResponse = await makeRequest('GET', '/api/employees?limit=1');
    if (employeesResponse.success && employeesResponse.data.success && employeesResponse.data.data.length > 0) {
      testEmployeeId = employeesResponse.data.data[0].id;
      console.log(`✅ Using real employee ID: ${testEmployeeId}`);
    } else {
      console.log(`⚠️  Using fallback employee ID: ${testEmployeeId}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not fetch employee, using fallback ID: ${testEmployeeId}`);
  }
  
  console.log(`Using test class ID: ${testClassId}`);
}

// Task Management System Tests
async function testTaskManagementSystem() {
  console.log('\n📋 Testing Task Management System APIs...');

  // Test 1: GET /api/tasks (list tasks)
  const listTasksResponse = await makeRequest('GET', '/api/tasks');
  logTest(
    'GET /api/tasks - List tasks',
    listTasksResponse.success && listTasksResponse.data.success,
    listTasksResponse.success ? '' : `Status: ${listTasksResponse.status}, Error: ${JSON.stringify(listTasksResponse.data)}`
  );

  // Test 2: GET /api/tasks with filters
  const filteredTasksResponse = await makeRequest('GET', '/api/tasks?status=active&limit=10');
  logTest(
    'GET /api/tasks with filters',
    filteredTasksResponse.success && filteredTasksResponse.data.success,
    filteredTasksResponse.success ? '' : `Status: ${filteredTasksResponse.status}`
  );

  // Test 3: POST /api/tasks (create task) - Valid data
  const createTaskData = {
    title: 'Test Task for API Testing',
    description: 'This is a test task created by the API test script',
    task_type: 'custom',
    frequency: { type: 'once' },
    meta_data: { test: true, priority: 'medium' },
    created_by_employee_id: testEmployeeId
  };

  const createTaskResponse = await makeRequest('POST', '/api/tasks', createTaskData);
  logTest(
    'POST /api/tasks - Create task (valid data)',
    createTaskResponse.success && createTaskResponse.data.success,
    createTaskResponse.success ? '' : `Status: ${createTaskResponse.status}, Error: ${JSON.stringify(createTaskResponse.data)}`
  );

  if (createTaskResponse.success && createTaskResponse.data.data) {
    createdTaskId = createTaskResponse.data.data.id;
    console.log(`Created task ID: ${createdTaskId}`);
  }

  // Test 4: POST /api/tasks (create task) - Invalid data (missing title)
  const invalidTaskData = {
    description: 'Task without title',
    class_id: testClassId
  };

  const invalidTaskResponse = await makeRequest('POST', '/api/tasks', invalidTaskData);
  logTest(
    'POST /api/tasks - Create task (invalid data - missing title)',
    !invalidTaskResponse.success || !invalidTaskResponse.data.success,
    invalidTaskResponse.success && invalidTaskResponse.data.success ? 'Should have failed but succeeded' : ''
  );

  // Test 5: GET /api/tasks/[id] (get specific task)
  if (createdTaskId) {
    const getTaskResponse = await makeRequest('GET', `/api/tasks/${createdTaskId}`);
    logTest(
      'GET /api/tasks/[id] - Get specific task',
      getTaskResponse.success && getTaskResponse.data.success,
      getTaskResponse.success ? '' : `Status: ${getTaskResponse.status}`
    );
  }

  // Test 6: GET /api/tasks/[id] (non-existent task)
  const getNonExistentTaskResponse = await makeRequest('GET', '/api/tasks/non-existent-id');
  logTest(
    'GET /api/tasks/[id] - Non-existent task',
    !getNonExistentTaskResponse.success || getNonExistentTaskResponse.status === 404,
    getNonExistentTaskResponse.success && getNonExistentTaskResponse.status !== 404 ? 'Should return 404' : ''
  );

  // Test 7: PUT /api/tasks/[id] (update task)
  if (createdTaskId) {
    const updateTaskData = {
      title: 'Updated Test Task',
      status: 'completed'
    };

    const updateTaskResponse = await makeRequest('PUT', `/api/tasks/${createdTaskId}`, updateTaskData);
    logTest(
      'PUT /api/tasks/[id] - Update task',
      updateTaskResponse.success && updateTaskResponse.data.success,
      updateTaskResponse.success ? '' : `Status: ${updateTaskResponse.status}`
    );
  }

  // Test 8: DELETE /api/tasks/[id] (delete task)
  if (createdTaskId) {
    const deleteTaskResponse = await makeRequest('DELETE', `/api/tasks/${createdTaskId}`);
    logTest(
      'DELETE /api/tasks/[id] - Delete task',
      deleteTaskResponse.success && deleteTaskResponse.data.success,
      deleteTaskResponse.success ? '' : `Status: ${deleteTaskResponse.status}`
    );
  }
}

// HR Request System Tests
async function testHRRequestSystem() {
  console.log('\n📝 Testing HR Request System APIs...');

  // Test 1: GET /api/requests (list requests)
  const listRequestsResponse = await makeRequest('GET', '/api/requests');
  logTest(
    'GET /api/requests - List requests',
    listRequestsResponse.success && listRequestsResponse.data.success,
    listRequestsResponse.success ? '' : `Status: ${listRequestsResponse.status}`
  );

  // Test 2: GET /api/requests with filters
  const filteredRequestsResponse = await makeRequest('GET', '/api/requests?status=pending&limit=10');
  logTest(
    'GET /api/requests with filters',
    filteredRequestsResponse.success && filteredRequestsResponse.data.success,
    filteredRequestsResponse.success ? '' : `Status: ${filteredRequestsResponse.status}`
  );

  // Test 3: POST /api/requests - Valid request
  const requestData = {
    employee_id: testEmployeeId,
    status: 'pending',
    priority: 'medium',
    due_date: '2024-12-31',
    data: {
      type: 'leave',
      from_date: '2024-12-25',
      to_date: '2024-12-27',
      reason: 'Personal leave for testing'
    }
  };

  const createRequestResponse = await makeRequest('POST', '/api/requests', requestData);
  logTest(
    'POST /api/requests - Create request',
    createRequestResponse.success && createRequestResponse.data.success,
    createRequestResponse.success ? '' : `Status: ${createRequestResponse.status}, Error: ${JSON.stringify(createRequestResponse.data)}`
  );

  if (createRequestResponse.success && createRequestResponse.data.data) {
    createdRequestId = createRequestResponse.data.data.id;
    console.log(`Created request ID: ${createdRequestId}`);
  }

  // Test 4: POST /api/requests - High priority request
  const highPriorityRequestData = {
    employee_id: testEmployeeId,
    status: 'pending',
    priority: 'high',
    due_date: '2024-12-20',
    data: {
      type: 'urgent_leave',
      reason: 'Emergency situation for testing'
    }
  };

  const createHighPriorityRequestResponse = await makeRequest('POST', '/api/requests', highPriorityRequestData);
  logTest(
    'POST /api/requests - Create high priority request',
    createHighPriorityRequestResponse.success && createHighPriorityRequestResponse.data.success,
    createHighPriorityRequestResponse.success ? '' : `Status: ${createHighPriorityRequestResponse.status}`
  );

  // Test 5: POST /api/requests - Invalid status
  const invalidStatusRequestData = {
    employee_id: testEmployeeId,
    status: 'invalid_status',
    priority: 'medium',
    data: { type: 'test' }
  };

  const invalidStatusRequestResponse = await makeRequest('POST', '/api/requests', invalidStatusRequestData);
  logTest(
    'POST /api/requests - Invalid status',
    !invalidStatusRequestResponse.success || !invalidStatusRequestResponse.data.success,
    invalidStatusRequestResponse.success && invalidStatusRequestResponse.data.success ? 'Should have failed but succeeded' : ''
  );

  // Test 6: POST /api/requests - Invalid priority
  const invalidPriorityRequestData = {
    employee_id: testEmployeeId,
    status: 'pending',
    priority: 'invalid_priority',
    data: { type: 'test' }
  };

  const invalidPriorityRequestResponse = await makeRequest('POST', '/api/requests', invalidPriorityRequestData);
  logTest(
    'POST /api/requests - Invalid priority',
    !invalidPriorityRequestResponse.success || !invalidPriorityRequestResponse.data.success,
    invalidPriorityRequestResponse.success && invalidPriorityRequestResponse.data.success ? 'Should have failed but succeeded' : ''
  );

  // Test 7: POST /api/requests - Missing employee_id
  const missingEmployeeRequestData = {
    status: 'pending',
    priority: 'medium',
    data: { type: 'test' }
  };

  const missingEmployeeRequestResponse = await makeRequest('POST', '/api/requests', missingEmployeeRequestData);
  logTest(
    'POST /api/requests - Missing employee_id',
    !missingEmployeeRequestResponse.success || !missingEmployeeRequestResponse.data.success,
    missingEmployeeRequestResponse.success && missingEmployeeRequestResponse.data.success ? 'Should have failed but succeeded' : ''
  );

  // Test 8: GET /api/requests/[id] (get specific request)
  if (createdRequestId) {
    const getRequestResponse = await makeRequest('GET', `/api/requests/${createdRequestId}`);
    logTest(
      'GET /api/requests/[id] - Get specific request',
      getRequestResponse.success && getRequestResponse.data.success,
      getRequestResponse.success ? '' : `Status: ${getRequestResponse.status}`
    );
  }

  // Test 9: PATCH /api/requests/[id] (update request status)
  if (createdRequestId) {
    const updateRequestData = {
      status: 'approved',
      approver_employee_id: testEmployeeId
    };

    const updateRequestResponse = await makeRequest('PATCH', `/api/requests/${createdRequestId}`, updateRequestData);
    logTest(
      'PATCH /api/requests/[id] - Update request status',
      updateRequestResponse.success && updateRequestResponse.data.success,
      updateRequestResponse.success ? '' : `Status: ${updateRequestResponse.status}`
    );
  }

  // Test 10: GET /api/requests/[id]/comments (get request comments)
  if (createdRequestId) {
    const getCommentsResponse = await makeRequest('GET', `/api/requests/${createdRequestId}/comments`);
    logTest(
      'GET /api/requests/[id]/comments - Get request comments',
      getCommentsResponse.success && getCommentsResponse.data.success,
      getCommentsResponse.success ? '' : `Status: ${getCommentsResponse.status}`
    );
  }

  // Test 11: POST /api/requests/[id]/comments (create comment)
  if (createdRequestId) {
    const commentData = {
      comment: 'This is a test comment for the API testing',
      employee_id: testEmployeeId
    };

    const createCommentResponse = await makeRequest('POST', `/api/requests/${createdRequestId}/comments`, commentData);
    logTest(
      'POST /api/requests/[id]/comments - Create comment',
      createCommentResponse.success && createCommentResponse.data.success,
      createCommentResponse.success ? '' : `Status: ${createCommentResponse.status}, Error: ${JSON.stringify(createCommentResponse.data)}`
    );
  }

  // Test 12: DELETE /api/requests/[id] (delete request) - should fail for approved request
  if (createdRequestId) {
    const deleteRequestResponse = await makeRequest('DELETE', `/api/requests/${createdRequestId}`);
    logTest(
      'DELETE /api/requests/[id] - Delete approved request (should fail)',
      !deleteRequestResponse.success || !deleteRequestResponse.data.success,
      deleteRequestResponse.success && deleteRequestResponse.data.success ? 'Should have failed but succeeded' : ''
    );
  }
}

// Employee Request System Tests
async function testEmployeeRequestSystem() {
  console.log('\n👥 Testing Employee Request System APIs...');

  // Test 1: GET /api/employee-requests (list employee requests)
  const listEmployeeRequestsResponse = await makeRequest('GET', '/api/employee-requests');
  logTest(
    'GET /api/employee-requests - List employee requests',
    listEmployeeRequestsResponse.success && listEmployeeRequestsResponse.data.success,
    listEmployeeRequestsResponse.success ? '' : `Status: ${listEmployeeRequestsResponse.status}`
  );

  // Test 2: POST /api/employee-requests (create employee request)
  const employeeRequestData = {
    employee_id: testEmployeeId,
    type: 'leave',
    title: 'Test Employee Leave Request',
    description: 'Testing employee request API',
    start_date: '2024-12-25',
    end_date: '2024-12-27',
    data: {
      reason: 'Personal leave for API testing'
    }
  };

  const createEmployeeRequestResponse = await makeRequest('POST', '/api/employee-requests', employeeRequestData);
  logTest(
    'POST /api/employee-requests - Create employee request',
    createEmployeeRequestResponse.success && createEmployeeRequestResponse.data.success,
    createEmployeeRequestResponse.success ? '' : `Status: ${createEmployeeRequestResponse.status}, Error: ${JSON.stringify(createEmployeeRequestResponse.data)}`
  );

  if (createEmployeeRequestResponse.success && createEmployeeRequestResponse.data.data) {
    createdEmployeeRequestId = createEmployeeRequestResponse.data.data.id;
    console.log(`Created employee request ID: ${createdEmployeeRequestId}`);
  }

  // Test 3: POST /api/employee-requests - Invalid type
  const invalidEmployeeRequestData = {
    employee_id: testEmployeeId,
    type: 'invalid_type',
    title: 'Invalid Request',
    start_date: '2024-12-25'
  };

  const invalidEmployeeRequestResponse = await makeRequest('POST', '/api/employee-requests', invalidEmployeeRequestData);
  logTest(
    'POST /api/employee-requests - Invalid request type',
    !invalidEmployeeRequestResponse.success || !invalidEmployeeRequestResponse.data.success,
    invalidEmployeeRequestResponse.success && invalidEmployeeRequestResponse.data.success ? 'Should have failed but succeeded' : ''
  );

  // Test 4: GET /api/employee-requests with filters
  const filteredEmployeeRequestsResponse = await makeRequest('GET', `/api/employee-requests?employee_id=${testEmployeeId}&status=pending`);
  logTest(
    'GET /api/employee-requests with filters',
    filteredEmployeeRequestsResponse.success && filteredEmployeeRequestsResponse.data.success,
    filteredEmployeeRequestsResponse.success ? '' : `Status: ${filteredEmployeeRequestsResponse.status}`
  );
}

// Test unsupported HTTP methods
async function testUnsupportedMethods() {
  console.log('\n🚫 Testing Unsupported HTTP Methods...');

  // Test unsupported method on tasks endpoint
  const unsupportedTaskResponse = await makeRequest('PATCH', '/api/tasks');
  logTest(
    'PATCH /api/tasks - Unsupported method',
    unsupportedTaskResponse.status === 405,
    unsupportedTaskResponse.status !== 405 ? `Expected 405, got ${unsupportedTaskResponse.status}` : ''
  );

  // Test unsupported method on requests endpoint
  const unsupportedRequestResponse = await makeRequest('PUT', '/api/requests');
  logTest(
    'PUT /api/requests - Unsupported method',
    unsupportedRequestResponse.status === 405,
    unsupportedRequestResponse.status !== 405 ? `Expected 405, got ${unsupportedRequestResponse.status}` : ''
  );
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests for Task and Request Systems...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('⚠️  Note: Make sure your Next.js development server is running on localhost:3000');
  
  try {
    await setupTestData();
    await testTaskManagementSystem();
    await testHRRequestSystem();
    await testEmployeeRequestSystem();
    await testUnsupportedMethods();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed tests:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.testName}: ${test.details}`);
        });
    }
    
    console.log('\n✨ API testing completed!');
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testTaskManagementSystem,
  testHRRequestSystem,
  testEmployeeRequestSystem
};
