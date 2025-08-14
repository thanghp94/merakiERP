import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTaskInstances(req, res);
      case 'POST':
        return await createTaskInstance(req, res);
      case 'PATCH':
        return await updateTaskInstance(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
        return res.status(405).json({ 
          success: false, 
          message: `Phương thức ${req.method} không được hỗ trợ` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ' 
    });
  }
}

async function getTaskInstances(req: NextApiRequest, res: NextApiResponse) {
  const { 
    assigned_to_employee_id,
    status,
    category,
    date_from,
    date_to,
    limit = 50, 
    offset = 0,
    include_overdue = 'false'
  } = req.query;

  let query = supabase
    .from('task_instances')
    .select(`
      task_instance_id,
      task_id,
      assigned_to_employee_id,
      due_date,
      status,
      completion_data,
      created_at,
      updated_at,
      task:tasks!task_instances_task_id_fkey (
        task_id,
        title,
        description,
        task_type,
        frequency,
        meta_data,
        created_by_employee_id
      ),
      assigned_to:employees!task_instances_assigned_to_employee_id_fkey (
        id,
        full_name,
        position,
        data
      )
    `)
    .order('due_date', { ascending: true });

  // Filter by assigned employee
  if (assigned_to_employee_id) {
    query = query.eq('assigned_to_employee_id', assigned_to_employee_id);
  }

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Filter by date range
  if (date_from) {
    query = query.gte('due_date', date_from);
  }
  if (date_to) {
    query = query.lte('due_date', date_to);
  }

  // Include overdue tasks
  if (include_overdue === 'true') {
    query = query.or('status.eq.overdue,due_date.lt.' + new Date().toISOString());
  }

  // Apply pagination
  if (limit) {
    query = query.limit(parseInt(limit as string));
  }
  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data: taskInstances, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách công việc' 
    });
  }

  // Filter by category if specified (from task meta_data)
  let filteredInstances = taskInstances;
  if (category && category !== 'all') {
    filteredInstances = taskInstances?.filter(instance => 
      instance.task && 
      typeof instance.task === 'object' && 
      'meta_data' in instance.task &&
      instance.task.meta_data &&
      typeof instance.task.meta_data === 'object' &&
      'category' in instance.task.meta_data &&
      instance.task.meta_data.category === category
    ) || [];
  }

  // Get statistics
  const stats = {
    total: filteredInstances?.length || 0,
    pending: filteredInstances?.filter(t => t.status === 'pending').length || 0,
    completed: filteredInstances?.filter(t => t.status === 'completed').length || 0,
    overdue: filteredInstances?.filter(t => t.status === 'overdue').length || 0
  };

  return res.status(200).json({
    success: true,
    data: filteredInstances,
    stats,
    message: 'Lấy danh sách công việc thành công'
  });
}

async function createTaskInstance(req: NextApiRequest, res: NextApiResponse) {
  const { 
    task_id,
    assigned_to_employee_id,
    due_date,
    status = 'pending',
    completion_data = {}
  } = req.body;

  if (!task_id || !assigned_to_employee_id || !due_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'task_id, assigned_to_employee_id và due_date là bắt buộc' 
    });
  }

  // Validate status
  if (!['pending', 'completed', 'overdue'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trạng thái phải là pending, completed hoặc overdue' 
    });
  }

  // Check if task exists
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('task_id, title')
    .eq('task_id', task_id)
    .single();

  if (taskError || !task) {
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy mẫu công việc' 
    });
  }

  // Check if employee exists
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', assigned_to_employee_id)
    .single();

  if (employeeError || !employee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy nhân viên' 
    });
  }

  const { data: taskInstance, error } = await supabase
    .from('task_instances')
    .insert({
      task_id,
      assigned_to_employee_id,
      due_date,
      status,
      completion_data
    })
    .select(`
      task_instance_id,
      task_id,
      assigned_to_employee_id,
      due_date,
      status,
      completion_data,
      created_at,
      updated_at,
      task:tasks!task_instances_task_id_fkey (
        task_id,
        title,
        description,
        task_type,
        meta_data
      ),
      assigned_to:employees!task_instances_assigned_to_employee_id_fkey (
        id,
        full_name,
        position
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo công việc mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: taskInstance,
    message: 'Tạo công việc mới thành công'
  });
}

async function updateTaskInstance(req: NextApiRequest, res: NextApiResponse) {
  const { task_instance_id } = req.query;
  const { 
    status,
    completion_data,
    due_date
  } = req.body;

  if (!task_instance_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'task_instance_id là bắt buộc' 
    });
  }

  // Validate status if provided
  if (status && !['pending', 'completed', 'overdue'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trạng thái phải là pending, completed hoặc overdue' 
    });
  }

  // Build update object
  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (completion_data !== undefined) updateData.completion_data = completion_data;
  if (due_date !== undefined) updateData.due_date = due_date;

  // Add completion timestamp if marking as completed
  if (status === 'completed' && completion_data) {
    updateData.completion_data = {
      ...completion_data,
      completed_at: new Date().toISOString()
    };
  }

  const { data: taskInstance, error } = await supabase
    .from('task_instances')
    .update(updateData)
    .eq('task_instance_id', task_instance_id)
    .select(`
      task_instance_id,
      task_id,
      assigned_to_employee_id,
      due_date,
      status,
      completion_data,
      created_at,
      updated_at,
      task:tasks!task_instances_task_id_fkey (
        task_id,
        title,
        description,
        task_type,
        meta_data
      ),
      assigned_to:employees!task_instances_assigned_to_employee_id_fkey (
        id,
        full_name,
        position
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật công việc' 
    });
  }

  if (!taskInstance) {
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy công việc' 
    });
  }

  return res.status(200).json({
    success: true,
    data: taskInstance,
    message: 'Cập nhật công việc thành công'
  });
}
