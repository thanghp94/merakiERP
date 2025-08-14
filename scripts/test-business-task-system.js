const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessTaskSystem() {
  console.log('🧪 Testing Business Task Management System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    if (tasksError) {
      console.error('❌ Tasks table error:', tasksError.message);
      return;
    }
    console.log('✅ Tasks table exists');

    const { data: taskInstances, error: instancesError } = await supabase
      .from('task_instances')
      .select('*')
      .limit(1);
    
    if (instancesError) {
      console.error('❌ Task instances table error:', instancesError.message);
      return;
    }
    console.log('✅ Task instances table exists');

    const { data: taskComments, error: commentsError } = await supabase
      .from('task_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ Task comments table error:', commentsError.message);
      return;
    }
    console.log('✅ Task comments table exists\n');

    // Test 2: Get an employee for testing
    console.log('2. Getting test employee...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, position')
      .limit(1);
    
    if (empError || !employees || employees.length === 0) {
      console.error('❌ No employees found for testing');
      return;
    }
    
    const testEmployee = employees[0];
    console.log(`✅ Using employee: ${testEmployee.full_name} (${testEmployee.position})\n`);

    // Test 3: Create a custom task template
    console.log('3. Creating custom task template...');
    const customTask = {
      title: 'Liên hệ phụ huynh về tình hình học tập',
      description: 'Gọi điện cho phụ huynh để báo cáo tình hình học tập của học sinh',
      task_type: 'custom',
      meta_data: {
        category: 'liên_hệ_phụ_huynh',
        priority: 'cao',
        student_name: 'Nguyễn Văn A',
        parent_phone: '0987654321',
        estimated_hours: 0.5
      },
      created_by_employee_id: testEmployee.id
    };

    const { data: createdTask, error: createError } = await supabase
      .from('tasks')
      .insert(customTask)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create custom task:', createError.message);
      return;
    }
    console.log(`✅ Created custom task: ${createdTask.title}\n`);

    // Test 4: Create a repeated task template
    console.log('4. Creating repeated task template...');
    const repeatedTask = {
      title: 'Chuẩn bị giáo án hàng tuần',
      description: 'Chuẩn bị giáo án và tài liệu giảng dạy cho tuần học',
      task_type: 'repeated',
      frequency: {
        repeat: 'weekly',
        days: ['Thứ Hai', 'Thứ Năm']
      },
      meta_data: {
        category: 'giảng_dạy',
        priority: 'cao',
        class_name: 'GrapeSEED A1',
        estimated_hours: 2
      },
      created_by_employee_id: testEmployee.id
    };

    const { data: createdRepeatedTask, error: repeatError } = await supabase
      .from('tasks')
      .insert(repeatedTask)
      .select()
      .single();

    if (repeatError) {
      console.error('❌ Failed to create repeated task:', repeatError.message);
      return;
    }
    console.log(`✅ Created repeated task: ${createdRepeatedTask.title}\n`);

    // Test 5: Create task instances
    console.log('5. Creating task instances...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskInstance = {
      task_id: createdTask.task_id,
      assigned_to_employee_id: testEmployee.id,
      due_date: tomorrow.toISOString(),
      status: 'pending'
    };

    const { data: createdInstance, error: instanceError } = await supabase
      .from('task_instances')
      .insert(taskInstance)
      .select()
      .single();

    if (instanceError) {
      console.error('❌ Failed to create task instance:', instanceError.message);
      return;
    }
    console.log(`✅ Created task instance for tomorrow\n`);

    // Test 6: Add a comment to the task instance
    console.log('6. Adding comment to task instance...');
    const comment = {
      task_instance_id: createdInstance.task_instance_id,
      employee_id: testEmployee.id,
      comment: 'Đã liên hệ với phụ huynh, sẽ gọi lại vào chiều mai.'
    };

    const { data: createdComment, error: commentError } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (commentError) {
      console.error('❌ Failed to create comment:', commentError.message);
      return;
    }
    console.log(`✅ Added comment to task instance\n`);

    // Test 7: Test filtering and querying
    console.log('7. Testing queries and filters...');
    
    // Get tasks by category
    const { data: teachingTasks, error: filterError } = await supabase
      .from('tasks')
      .select('*')
      .eq('meta_data->>category', 'giảng_dạy');

    if (filterError) {
      console.error('❌ Failed to filter tasks by category:', filterError.message);
      return;
    }
    console.log(`✅ Found ${teachingTasks.length} teaching tasks`);

    // Get pending task instances with task details
    const { data: pendingInstances, error: pendingError } = await supabase
      .from('task_instances')
      .select(`
        *,
        task:tasks(*),
        assigned_to:employees(full_name, position)
      `)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('❌ Failed to get pending instances:', pendingError.message);
      return;
    }
    console.log(`✅ Found ${pendingInstances.length} pending task instances\n`);

    // Test 8: Update task instance status
    console.log('8. Testing task completion...');
    const { data: completedInstance, error: completeError } = await supabase
      .from('task_instances')
      .update({
        status: 'completed',
        completion_data: {
          completed_at: new Date().toISOString(),
          notes: 'Đã hoàn thành công việc đúng hạn'
        }
      })
      .eq('task_instance_id', createdInstance.task_instance_id)
      .select()
      .single();

    if (completeError) {
      console.error('❌ Failed to complete task:', completeError.message);
      return;
    }
    console.log(`✅ Marked task instance as completed\n`);

    // Test 9: Test scheduler function (if exists)
    console.log('9. Testing scheduler function...');
    try {
      const { data: schedulerResult, error: schedulerError } = await supabase
        .rpc('generate_task_instances');

      if (schedulerError) {
        console.log('⚠️  Scheduler function not available or failed:', schedulerError.message);
      } else {
        console.log('✅ Scheduler function executed successfully');
      }
    } catch (error) {
      console.log('⚠️  Scheduler function test skipped:', error.message);
    }

    console.log('\n🎉 Business Task Management System test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created 1 custom task template`);
    console.log(`- Created 1 repeated task template`);
    console.log(`- Created 1 task instance`);
    console.log(`- Added 1 comment`);
    console.log(`- Tested filtering and querying`);
    console.log(`- Tested task completion`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testBusinessTaskSystem();
