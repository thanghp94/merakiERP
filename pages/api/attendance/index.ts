import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(req, res);
      case 'POST':
        return await createAttendance(req, res);
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

async function getAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { session_id, student_id, status, date, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false });

  if (session_id) {
    query = query.eq('session_id', session_id);
  }

  if (student_id) {
    query = query.eq('student_id', student_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (date) {
    query = query.eq('teaching_sessions.session_date', date);
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
      message: 'Không thể lấy danh sách điểm danh' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách điểm danh thành công'
  });
}

async function createAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { session_id, student_id, status = 'present', check_in_time, data = {} } = req.body;

  if (!session_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học là bắt buộc' 
    });
  }

  if (!student_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID học sinh là bắt buộc' 
    });
  }

  // Check if attendance record already exists
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('session_id', session_id)
    .eq('student_id', student_id)
    .single();

  if (existingAttendance) {
    return res.status(409).json({ 
      success: false, 
      message: 'Điểm danh cho học sinh này trong buổi học đã tồn tại' 
    });
  }

  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert({
      session_id,
      student_id,
      status,
      check_in_time: check_in_time || new Date().toISOString(),
      data
    })
    .select('*')
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo điểm danh mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: attendance,
    message: 'Tạo điểm danh mới thành công'
  });
}
