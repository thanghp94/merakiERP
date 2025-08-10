import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getSessions(req, res);
      case 'POST':
        return await createSession(req, res);
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

async function getSessions(req: NextApiRequest, res: NextApiResponse) {
  const { class_id, teacher_id, start_date, end_date, limit = 100, offset = 0 } = req.query;

  let query = supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: true });

  // Filter by date range if provided (for schedule view)
  if (start_date && end_date) {
    query = query
      .gte('date', start_date)
      .lte('date', end_date);
  }

  // Note: class_id filtering removed since we're not joining with main_sessions

  if (teacher_id) {
    query = query.eq('teacher_id', teacher_id);
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
      message: 'Không thể lấy danh sách sessions' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách sessions thành công'
  });
}

async function createSession(req: NextApiRequest, res: NextApiResponse) {
  const { 
    lesson_id, 
    subject_type, 
    teacher_id, 
    teaching_assistant_id,
    location_id,
    start_time, 
    end_time, 
    data = {} 
  } = req.body;

  if (!lesson_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Lesson ID là bắt buộc' 
    });
  }

  if (!subject_type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Loại môn học là bắt buộc' 
    });
  }

  if (!teacher_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID giáo viên là bắt buộc' 
    });
  }

  if (!start_time) {
    return res.status(400).json({ 
      success: false, 
      message: 'Thời gian bắt đầu là bắt buộc' 
    });
  }

  if (!end_time) {
    return res.status(400).json({ 
      success: false, 
      message: 'Thời gian kết thúc là bắt buộc' 
    });
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      lesson_id: parseInt(lesson_id),
      subject_type,
      teacher_id,
      teaching_assistant_id: teaching_assistant_id || null,
      location_id: location_id || null,
      start_time,
      end_time,
      data
    })
    .select(`
      *,
      main_sessions!fk_sessions_lesson_id (
        main_session_id,
        main_session_name,
        scheduled_date,
        class_id,
        classes (
          id,
          class_name,
          data
        )
      ),
      employees!fk_sessions_teacher_id (
        id,
        full_name
      ),
      employees!fk_sessions_ta_id (
        id,
        full_name
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo session mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: session,
    message: 'Tạo session mới thành công'
  });
}
