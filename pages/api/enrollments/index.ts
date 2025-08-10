import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEnrollments(req, res);
      case 'POST':
        return await createEnrollment(req, res);
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

async function getEnrollments(req: NextApiRequest, res: NextApiResponse) {
  const { status, student_id, class_id, limit = 50, offset = 0 } = req.query;

  let query = supabase
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
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (student_id) {
    query = query.eq('student_id', student_id);
  }

  if (class_id) {
    query = query.eq('class_id', class_id);
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
      message: 'Không thể lấy danh sách đăng ký' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách đăng ký thành công'
  });
}

async function createEnrollment(req: NextApiRequest, res: NextApiResponse) {
  const { student_id, class_id, enrollment_date, status = 'active', data = {} } = req.body;

  if (!student_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID học sinh là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  // Check if enrollment already exists
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', student_id)
    .eq('class_id', class_id)
    .single();

  if (existingEnrollment) {
    return res.status(409).json({ 
      success: false, 
      message: 'Học sinh đã được đăng ký vào lớp học này' 
    });
  }

  const { data: newEnrollment, error } = await supabase
    .from('enrollments')
    .insert({
      student_id,
      class_id,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      status,
      data
    })
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
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo đăng ký mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: newEnrollment,
    message: 'Tạo đăng ký mới thành công'
  });
}
