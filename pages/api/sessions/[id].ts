import { NextApiRequest, NextApiResponse } from 'next';

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
  // Mock session data
  const mockSession = {
    id: id,
    lesson_id: 'main-session-1',
    subject_type: 'speaking',
    teacher_id: 'teacher-1',
    teaching_assistant_id: 'ta-1',
    location_id: 'room-1',
    start_time: '09:00',
    end_time: '10:30',
    data: { notes: 'Focus on pronunciation' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  // Mock main session
  const mockMainSession = {
    main_session_id: 'main-session-1',
    main_session_name: 'Unit 1: Introduction',
    scheduled_date: '2024-01-15',
    class_id: 'class-1',
    classes: {
      id: 'class-1',
      class_name: 'English Basic A1',
      data: { level: 'beginner' }
    }
  };

  // Mock teacher
  const mockTeacher = {
    id: 'teacher-1',
    full_name: 'Nguyễn Văn An'
  };

  // Mock teaching assistant
  const mockTeachingAssistant = {
    id: 'ta-1',
    full_name: 'Trần Thị Bình'
  };

  // Combine the data
  const combinedData = {
    ...mockSession,
    main_sessions: mockMainSession,
    teacher: mockTeacher,
    teaching_assistant: mockTeachingAssistant
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

  // Mock updated session
  const updatedSession = {
    id: id,
    lesson_id: 'main-session-1',
    subject_type: updateData.subject_type || 'speaking',
    teacher_id: updateData.teacher_id || 'teacher-1',
    teaching_assistant_id: updateData.teaching_assistant_id || 'ta-1',
    location_id: updateData.location_id || 'room-1',
    start_time: updateData.start_time || '09:00',
    end_time: updateData.end_time || '10:30',
    data: updateData.data || { notes: 'Updated session' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };

  // Mock main session
  const mockMainSession = {
    main_session_id: 'main-session-1',
    main_session_name: 'Unit 1: Introduction',
    scheduled_date: '2024-01-15',
    class_id: 'class-1',
    classes: {
      id: 'class-1',
      class_name: 'English Basic A1',
      data: { level: 'beginner' }
    }
  };

  // Mock teacher
  const mockTeacher = {
    id: updatedSession.teacher_id,
    full_name: 'Nguyễn Văn An'
  };

  // Mock teaching assistant
  const mockTeachingAssistant = {
    id: updatedSession.teaching_assistant_id,
    full_name: 'Trần Thị Bình'
  };

  // Combine the data
  const combinedData = {
    ...updatedSession,
    main_sessions: mockMainSession,
    teacher: mockTeacher,
    teaching_assistant: mockTeachingAssistant
  };

  return res.status(200).json({
    success: true,
    data: combinedData,
    message: 'Cập nhật session thành công'
  });
}

async function deleteSession(req: NextApiRequest, res: NextApiResponse, id: string) {
  // Mock session deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa session thành công'
  });
}
