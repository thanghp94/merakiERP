import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getTeachingSession(id, res);
      case 'PUT':
        return await updateTeachingSession(id, req, res);
      case 'DELETE':
        return await deleteTeachingSession(id, res);
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

async function getTeachingSession(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('teaching_sessions')
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
        message: 'Không tìm thấy buổi học' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin buổi học' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin buổi học thành công'
  });
}

async function updateTeachingSession(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { class_id, teacher_id, session_date, start_time, end_time, status, data } = req.body;

  const updateData: any = {};
  if (class_id !== undefined) updateData.class_id = class_id;
  if (teacher_id !== undefined) updateData.teacher_id = teacher_id;
  if (session_date !== undefined) updateData.session_date = session_date;
  if (start_time !== undefined) updateData.start_time = start_time;
  if (end_time !== undefined) updateData.end_time = end_time;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: session, error } = await supabase
    .from('teaching_sessions')
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
        message: 'Không tìm thấy buổi học' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật buổi học' 
    });
  }

  return res.status(200).json({
    success: true,
    data: session,
    message: 'Cập nhật buổi học thành công'
  });
}

async function deleteTeachingSession(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('teaching_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa buổi học' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa buổi học thành công'
  });
}
