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
  // First get the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (sessionError) {
    console.error('Supabase error:', sessionError);
    return res.status(404).json({ 
      success: false, 
      message: 'Không tìm thấy session' 
    });
  }

  // Get the main session
  const { data: mainSession, error: mainSessionError } = await supabase
    .from('main_sessions')
    .select(`
      main_session_id,
      main_session_name,
      scheduled_date,
      class_id,
      classes (
        id,
        class_name,
        data
      )
    `)
    .eq('main_session_id', session.lesson_id)
    .single();

  if (mainSessionError) {
    console.error('Main session error:', mainSessionError);
  }

  // Get teacher info
  const { data: teacher, error: teacherError } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', session.teacher_id)
    .single();

  if (teacherError) {
    console.error('Teacher error:', teacherError);
  }

  // Get teaching assistant info if exists
  let teachingAssistant = null;
  if (session.teaching_assistant_id) {
    const { data: ta, error: taError } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('id', session.teaching_assistant_id)
      .single();

    if (!taError) {
      teachingAssistant = ta;
    }
  }

  // Combine the data
  const combinedData = {
    ...session,
    main_sessions: mainSession,
    teacher: teacher,
    teaching_assistant: teachingAssistant
  };

  return res.status(200).json({
    success: true,
    data: combinedData,
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

  // Update the session
  const { data: session, error: updateError } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    console.error('Supabase error:', updateError);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật session' 
    });
  }

  // Get the main session
  const { data: mainSession, error: mainSessionError } = await supabase
    .from('main_sessions')
    .select(`
      main_session_id,
      main_session_name,
      scheduled_date,
      class_id,
      classes (
        id,
        class_name,
        data
      )
    `)
    .eq('main_session_id', session.lesson_id)
    .single();

  if (mainSessionError) {
    console.error('Main session error:', mainSessionError);
  }

  // Get teacher info
  const { data: teacher, error: teacherError } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', session.teacher_id)
    .single();

  if (teacherError) {
    console.error('Teacher error:', teacherError);
  }

  // Get teaching assistant info if exists
  let teachingAssistant = null;
  if (session.teaching_assistant_id) {
    const { data: ta, error: taError } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('id', session.teaching_assistant_id)
      .single();

    if (!taError) {
      teachingAssistant = ta;
    }
  }

  // Combine the data
  const combinedData = {
    ...session,
    main_sessions: mainSession,
    teacher: teacher,
    teaching_assistant: teachingAssistant
  };

  return res.status(200).json({
    success: true,
    data: combinedData,
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
