import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID điểm danh là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(id, res);
      case 'PUT':
        return await updateAttendance(id, req, res);
      case 'DELETE':
        return await deleteAttendance(id, res);
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

async function getAttendance(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      teaching_sessions (
        id,
        session_date,
        start_time,
        end_time,
        classes (
          id,
          class_name,
          facilities (
            id,
            name
          )
        ),
        employees (
          id,
          full_name,
          position
        )
      ),
      students (
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy điểm danh' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin điểm danh' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin điểm danh thành công'
  });
}

async function updateAttendance(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { session_id, student_id, status, check_in_time, data } = req.body;

  const updateData: any = {};
  if (session_id !== undefined) updateData.session_id = session_id;
  if (student_id !== undefined) updateData.student_id = student_id;
  if (status !== undefined) updateData.status = status;
  if (check_in_time !== undefined) updateData.check_in_time = check_in_time;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: attendance, error } = await supabase
    .from('attendance')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      teaching_sessions (
        id,
        session_date,
        start_time,
        end_time,
        classes (
          id,
          class_name,
          facilities (
            id,
            name
          )
        ),
        employees (
          id,
          full_name,
          position
        )
      ),
      students (
        id,
        full_name,
        email,
        phone
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy điểm danh' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật điểm danh' 
    });
  }

  return res.status(200).json({
    success: true,
    data: attendance,
    message: 'Cập nhật điểm danh thành công'
  });
}

async function deleteAttendance(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa điểm danh' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa điểm danh thành công'
  });
}
