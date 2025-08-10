import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTeachingSessions(req, res);
      case 'POST':
        return await createTeachingSession(req, res);
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

async function getTeachingSessions(req: NextApiRequest, res: NextApiResponse) {
  const { class_id, teacher_id, session_date, status, start_date, end_date, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('teaching_sessions')
    .select(`
      *,
      main_sessions (
        id,
        main_session_name,
        scheduled_date,
        class_id,
        classes (
          id,
          class_name,
          data
        )
      ),
      employees!teaching_sessions_teacher_id_fkey (
        id,
        full_name
      ),
      employees!teaching_sessions_teaching_assistant_id_fkey (
        id,
        full_name
      )
    `)
    .order('start_time', { ascending: true });

  // Filter by date range if provided (for schedule view)
  if (start_date && end_date) {
    query = query
      .gte('main_sessions.scheduled_date', start_date)
      .lte('main_sessions.scheduled_date', end_date);
  }

  // Filter by specific class if provided
  if (class_id) {
    query = query.eq('main_sessions.class_id', class_id);
  }

  if (teacher_id) {
    query = query.eq('teacher_id', teacher_id);
  }

  if (session_date) {
    query = query.eq('main_sessions.scheduled_date', session_date);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (limit && !start_date) { // Don't limit for schedule view
    query = query.limit(parseInt(limit as string));
  }

  if (offset && !start_date) { // Don't offset for schedule view
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
      message: 'Không thể lấy danh sách buổi học' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách buổi học thành công'
  });
}

async function createTeachingSession(req: NextApiRequest, res: NextApiResponse) {
  const { class_id, teacher_id, session_date, start_time, end_time, status = 'scheduled', data = {} } = req.body;

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  if (!teacher_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID giáo viên là bắt buộc' 
    });
  }

  if (!session_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ngày học là bắt buộc' 
    });
  }

  if (!start_time) {
    return res.status(400).json({ 
      success: false, 
      message: 'Giờ bắt đầu là bắt buộc' 
    });
  }

  if (!end_time) {
    return res.status(400).json({ 
      success: false, 
      message: 'Giờ kết thúc là bắt buộc' 
    });
  }

  const { data: session, error } = await supabase
    .from('teaching_sessions')
    .insert({
      class_id,
      teacher_id,
      session_date,
      start_time,
      end_time,
      status,
      data
    })
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
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo buổi học mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: session,
    message: 'Tạo buổi học mới thành công'
  });
}
