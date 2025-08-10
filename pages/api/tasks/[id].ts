import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID bài tập là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getTask(id, res);
      case 'PUT':
        return await updateTask(id, req, res);
      case 'DELETE':
        return await deleteTask(id, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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

async function getTask(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      classes (
        id,
        class_name,
        status,
        facilities (
          id,
          name
        )
      ),
      employees (
        id,
        full_name,
        position,
        department
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài tập' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin bài tập' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin bài tập thành công'
  });
}

async function updateTask(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { title, description, class_id, assigned_by, due_date, task_type, status, data } = req.body;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (class_id !== undefined) updateData.class_id = class_id;
  if (assigned_by !== undefined) updateData.assigned_by = assigned_by;
  if (due_date !== undefined) updateData.due_date = due_date;
  if (task_type !== undefined) updateData.task_type = task_type;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      classes (
        id,
        class_name,
        status,
        facilities (
          id,
          name
        )
      ),
      employees (
        id,
        full_name,
        position,
        department
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài tập' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật bài tập' 
    });
  }

  return res.status(200).json({
    success: true,
    data: task,
    message: 'Cập nhật bài tập thành công'
  });
}

async function deleteTask(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa bài tập' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa bài tập thành công'
  });
}
