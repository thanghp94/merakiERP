import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID đăng ký là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEnrollment(id, res);
      case 'PUT':
        return await updateEnrollment(id, req, res);
      case 'DELETE':
        return await deleteEnrollment(id, res);
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

async function getEnrollment(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      students (
        id,
        full_name,
        email,
        phone,
        status
      ),
      classes (
        id,
        class_name,
        status,
        start_date,
        facilities (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đăng ký' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin đăng ký' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin đăng ký thành công'
  });
}

async function updateEnrollment(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { student_id, class_id, enrollment_date, status, data } = req.body;

  const updateData: any = {};
  if (student_id !== undefined) updateData.student_id = student_id;
  if (class_id !== undefined) updateData.class_id = class_id;
  if (enrollment_date !== undefined) updateData.enrollment_date = enrollment_date;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // If updating student_id or class_id, check for duplicate enrollment
  if (updateData.student_id || updateData.class_id) {
    const { data: currentEnrollment } = await supabase
      .from('enrollments')
      .select('student_id, class_id')
      .eq('id', id)
      .single();

    if (currentEnrollment) {
      const checkStudentId = updateData.student_id || currentEnrollment.student_id;
      const checkClassId = updateData.class_id || currentEnrollment.class_id;

      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', checkStudentId)
        .eq('class_id', checkClassId)
        .neq('id', id)
        .single();

      if (existingEnrollment) {
        return res.status(409).json({ 
          success: false, 
          message: 'Học sinh đã được đăng ký vào lớp học này' 
        });
      }
    }
  }

  const { data: updatedEnrollment, error } = await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      students (
        id,
        full_name,
        email,
        phone,
        status
      ),
      classes (
        id,
        class_name,
        status,
        start_date,
        facilities (
          id,
          name
        )
      )
    `)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đăng ký' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật đăng ký' 
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedEnrollment,
    message: 'Cập nhật đăng ký thành công'
  });
}

async function deleteEnrollment(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa đăng ký' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa đăng ký thành công'
  });
}
