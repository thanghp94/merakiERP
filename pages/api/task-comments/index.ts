import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTaskComments(req, res);
      case 'POST':
        return await createTaskComment(req, res);
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

async function getTaskComments(req: NextApiRequest, res: NextApiResponse) {
  const { 
    task_instance_id,
    employee_id,
    limit = 50, 
    offset = 0 
  } = req.query;

  if (!task_instance_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'task_instance_id là bắt buộc' 
    });
  }

  let query = supabase
    .from('task_comments')
    .select(`
      comment_id,
      task_instance_id,
      employee_id,
      comment,
      created_at,
      employee:employees!task_comments_employee_id_fkey (
        id,
        full_name,
        position,
        data
      )
    `)
    .eq('task_instance_id', task_instance_id)
    .order('created_at', { ascending: true });

  // Filter by employee if specified
  if (employee_id) {
    query = query.eq('employee_id', employee_id);
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

  const { data: comments, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách bình luận' 
    });
  }

  return res.status(200).json({
    success: true,
    data: comments,
    total: comments?.length || 0,
    message: 'Lấy danh sách bình luận thành công'
  });
}

async function createTaskComment(req: NextApiRequest, res: NextApiResponse) {
  const { 
    task_instance_id,
    employee_id,
    comment
  } = req.body;

  if (!task_instance_id || !employee_id || !comment) {
    return res.status(400).json({ 
      success: false, 
      message: 'task_instance_id, employee_id và comment là bắt buộc' 
    });
  }

  if (comment.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Bình luận không được để trống' 
    });
  }

  // Check if task instance exists
  const { data: taskInstance, error: taskInstanceError } = await supabase
    .from('task_instances')
    .select('task_instance_id')
    .eq('task_instance_id', task_instance_id)
    .single();

  if (taskInstanceError || !taskInstance) {
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy công việc' 
    });
  }

  // Check if employee exists
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', employee_id)
    .single();

  if (employeeError || !employee) {
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy nhân viên' 
    });
  }

  const { data: newComment, error } = await supabase
    .from('task_comments')
    .insert({
      task_instance_id,
      employee_id,
      comment: comment.trim()
    })
    .select(`
      comment_id,
      task_instance_id,
      employee_id,
      comment,
      created_at,
      employee:employees!task_comments_employee_id_fkey (
        id,
        full_name,
        position,
        data
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo bình luận mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: newComment,
    message: 'Tạo bình luận thành công'
  });
}
