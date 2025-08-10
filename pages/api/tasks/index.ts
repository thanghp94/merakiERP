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
    class_id, 
    assigned_by, 
    task_type, 
    status, 
    due_date,
    overdue,
    limit = 50, 
    offset = 0 
  } = req.query;

  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (class_id) {
    query = query.eq('class_id', class_id);
  }

  if (assigned_by) {
    query = query.eq('assigned_by', assigned_by);
  }

  if (task_type) {
    query = query.eq('task_type', task_type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (due_date) {
    query = query.eq('due_date', due_date);
  }

  if (overdue === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('due_date', today).eq('status', 'active');
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

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách bài tập' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách bài tập thành công'
  });
}

async function createTask(req: NextApiRequest, res: NextApiResponse) {
  const { 
    title, 
    description, 
    class_id, 
    assigned_by, 
    due_date, 
    task_type = 'homework', 
    status = 'active', 
    data = {} 
  } = req.body;

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tiêu đề bài tập là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      class_id,
      assigned_by,
      due_date,
      task_type,
      status,
      data
    })
    .select('*')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo bài tập mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: task,
    message: 'Tạo bài tập mới thành công'
  });
}
