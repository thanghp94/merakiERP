import { NextApiRequest, NextApiResponse } from 'next';

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

  // Firebase placeholder - return empty sessions list
  const mockSessions = [
    {
      id: 'mock-session-1',
      main_session_id: 'mock-main-session-1',
      subject_type: 'TSI',
      teacher_id: 'mock-teacher-1',
      teaching_assistant_id: null,
      location_id: 'room-1',
      start_time: '2025-01-21T02:00:00.000Z',
      end_time: '2025-01-21T03:30:00.000Z',
      date: '2025-01-21',
      main_sessions: {
        main_session_id: 'mock-main-session-1',
        main_session_name: 'Buổi học mẫu',
        scheduled_date: '2025-01-21',
        class_id: 'mock-class-1',
        classes: {
          id: 'mock-class-1',
          class_name: 'Lớp mẫu',
          data: {}
        }
      },
      teacher: {
        id: 'mock-teacher-1',
        full_name: 'Giáo viên mẫu'
      },
      location: {
        facility_name: 'Cơ sở Meraki',
        room_name: 'Phòng 1',
        room_id: 'room-1'
      }
    }
  ];

  return res.status(200).json({
    success: true,
    data: mockSessions,
    message: 'Lấy danh sách sessions thành công (Firebase placeholder)'
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

  // Firebase placeholder - simulate session creation
  const mockSession = {
    id: `mock-session-${Date.now()}`,
    lesson_id: parseInt(lesson_id),
    subject_type,
    teacher_id,
    teaching_assistant_id: teaching_assistant_id || null,
    location_id: location_id || null,
    start_time,
    end_time,
    data,
    created_at: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    data: mockSession,
    message: 'Tạo session mới thành công (Firebase placeholder)'
  });
}
