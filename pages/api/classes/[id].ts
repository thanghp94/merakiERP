import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getClass(id, res);
      case 'PUT':
        return await updateClass(id, req, res);
      case 'DELETE':
        return await deleteClass(id, res);
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

async function getClass(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin lớp học' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin lớp học thành công'
  });
}

async function updateClass(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { class_name, facility_id, status, start_date, data, current_unit } = req.body;

  const updateData: any = {};
  if (class_name !== undefined) updateData.class_name = class_name;
  if (facility_id !== undefined) updateData.facility_id = facility_id;
  if (status !== undefined) updateData.status = status;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (data !== undefined) updateData.data = data;
  if (current_unit !== undefined) updateData.current_unit = current_unit;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: updatedClass, error } = await supabase
    .from('classes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật lớp học' 
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedClass,
    message: 'Cập nhật lớp học thành công'
  });
}

async function deleteClass(id: string, res: NextApiResponse) {
  // First check if the class exists
  const { data: existingClass, error: checkError } = await supabase
    .from('classes')
    .select('id, class_name')
    .eq('id', id)
    .single();

  if (checkError) {
    if (checkError.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }
    console.error('Check class error:', checkError);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi kiểm tra lớp học' 
    });
  }

  // Check for related records that would prevent deletion
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', id)
    .limit(1);

  if (enrollmentError) {
    console.error('Check enrollments error:', enrollmentError);
  }

  const { data: sessions, error: sessionError } = await supabase
    .from('main_sessions')
    .select('id')
    .eq('class_id', id)
    .limit(1);

  if (sessionError) {
    console.error('Check sessions error:', sessionError);
  }

  // If there are related records, provide informative error
  if (enrollments && enrollments.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không thể xóa lớp học này vì đã có học sinh đăng ký. Vui lòng xóa tất cả đăng ký trước khi xóa lớp học.' 
    });
  }

  if (sessions && sessions.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không thể xóa lớp học này vì đã có buổi học được tạo. Vui lòng xóa tất cả buổi học trước khi xóa lớp học.' 
    });
  }

  // Proceed with deletion
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    
    // Handle specific foreign key constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa lớp học này vì có dữ liệu liên quan. Vui lòng xóa các dữ liệu liên quan trước.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa lớp học' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa lớp học thành công'
  });
}
