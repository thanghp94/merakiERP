import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID session không hợp lệ' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSession(req, res, id);
      case 'PUT':
        return await updateSession(req, res, id);
      case 'DELETE':
        return await deleteSession(req, res, id);
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

async function getSession(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { data, error } = await supabase
    .from('sessions')
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
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy session' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin session thành công'
  });
}

async function updateSession(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { 
    subject_type, 
    teacher_id, 
    teaching_assistant_id,
    location_id,
    start_time, 
    end_time, 
    data 
  } = req.body;

  const updateData: any = {};
  
  if (subject_type !== undefined) updateData.subject_type = subject_type;
  if (teacher_id !== undefined) updateData.teacher_id = teacher_id;
  if (teaching_assistant_id !== undefined) updateData.teaching_assistant_id = teaching_assistant_id;
  if (location_id !== undefined) updateData.location_id = location_id;
  if (start_time !== undefined) updateData.start_time = start_time;
  if (end_time !== undefined) updateData.end_time = end_time;
  if (data !== undefined) updateData.data = data;

  const { data: session, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
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
      message: 'Không thể cập nhật session' 
    });
  }

  return res.status(200).json({
    success: true,
    data: session,
    message: 'Cập nhật session thành công'
  });
}

async function deleteSession(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa session' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa session thành công'
  });
}
