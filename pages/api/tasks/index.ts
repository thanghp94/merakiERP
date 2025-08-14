import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTasks(req, res);
      case 'POST':
        return await createTask(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
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

async function getTasks(req: NextApiRequest, res: NextApiResponse) {
  const { 
    task_type, 
    created_by_employee_id,
    category,
    limit = 50, 
    offset = 0 
  } = req.query;

  let query = supabase
    .from('tasks')
    .select(`
      task_id,
      title,
      description,
      task_type,
      frequency,
      meta_data,
      created_by_employee_id,
      created_at,
      updated_at,
      created_by:employees!tasks_created_by_employee_id_fkey (
        id,
        full_name,
        position,
        data
      )
    `)
    .order('created_at', { ascending: false });

  if (task_type) {
    query = query.eq('task_type', task_type);
  }

  if (created_by_employee_id) {
    query = query.eq('created_by_employee_id', created_by_employee_id);
  }

  if (limit) {
    query = query.limit(parseInt(limit as string));
  }

  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách công việc' 
    });
  }

  // Filter by category if specified (from task meta_data)
  let filteredTasks = tasks;
  if (category && category !== 'all') {
    filteredTasks = tasks?.filter(task => 
      task.meta_data &&
      typeof task.meta_data === 'object' &&
      'category' in task.meta_data &&
      task.meta_data.category === category
    ) || [];
  }

  // Get task statistics
  const stats = {
    total: filteredTasks?.length || 0,
    repeated: filteredTasks?.filter(t => t.task_type === 'repeated').length || 0,
    custom: filteredTasks?.filter(t => t.task_type === 'custom').length || 0,
    categories: getUniqueCategories(filteredTasks || [])
  };

  return res.status(200).json({
    success: true,
    data: filteredTasks,
    stats,
    message: 'Lấy danh sách công việc thành công'
  });
}

function getUniqueCategories(tasks: any[]): string[] {
  const categories = new Set<string>();
  tasks.forEach(task => {
    if (task.meta_data && 
        typeof task.meta_data === 'object' && 
        'category' in task.meta_data && 
        task.meta_data.category) {
      categories.add(task.meta_data.category);
    }
  });
  return Array.from(categories);
}

async function createTask(req: NextApiRequest, res: NextApiResponse) {
  const { 
    title, 
    description, 
    task_type = 'custom', 
    frequency = null,
    meta_data = {},
    created_by_employee_id
  } = req.body;

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tiêu đề công việc là bắt buộc' 
    });
  }

  if (!task_type || !['repeated', 'custom'].includes(task_type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Loại công việc phải là "repeated" hoặc "custom"' 
    });
  }

  // Validate frequency for repeated tasks
  if (task_type === 'repeated' && !frequency) {
    return res.status(400).json({ 
      success: false, 
      message: 'Công việc lặp lại phải có thông tin tần suất' 
    });
  }

  // Validate employee exists if provided
  if (created_by_employee_id) {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', created_by_employee_id)
      .single();

    if (employeeError || !employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy nhân viên' 
      });
    }
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      task_type,
      frequency,
      meta_data,
      created_by_employee_id
    })
    .select(`
      task_id,
      title,
      description,
      task_type,
      frequency,
      meta_data,
      created_by_employee_id,
      created_at,
      updated_at,
      created_by:employees!tasks_created_by_employee_id_fkey (
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
    data: task,
    message: 'Tạo công việc mới thành công'
  });
}
