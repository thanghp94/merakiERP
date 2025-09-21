import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Firebase placeholder - return mock data for specific main session
      const mockData = {
        main_session_id: id,
        main_session_name: `Buổi học mẫu ${id}`,
        scheduled_date: '2025-01-21',
        class_id: 'mock-class-id',
        data: {
          start_time: '09:00',
          end_time: '10:30',
          total_duration_minutes: 90,
          created_by_form: true
        },
        classes: {
          id: 'mock-class-id',
          class_name: 'Lớp mẫu',
          facilities: {
            name: 'Cơ sở Meraki'
          }
        },
        sessions: [
          {
            id: 'mock-session-1',
            subject_type: 'TSI',
            start_time: '2025-01-21T02:00:00.000Z',
            end_time: '2025-01-21T03:30:00.000Z',
            employees: {
              id: 'mock-teacher-id',
              full_name: 'Giáo viên mẫu'
            },
            teaching_assistants: null
          }
        ]
      };

      return res.status(200).json({
        success: true,
        data: mockData,
        message: 'Lấy thông tin buổi học thành công (Firebase placeholder)'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không mong muốn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Firebase placeholder - simulate update
      const {
        main_session_name,
        scheduled_date,
        start_time,
        end_time,
        total_duration_minutes,
        class_id,
        is_active
      } = req.body;

      const updatedData = {
        main_session_id: id,
        main_session_name: main_session_name || `Buổi học đã cập nhật ${id}`,
        scheduled_date: scheduled_date || '2025-01-21',
        class_id: class_id || 'mock-class-id',
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        data: updatedData,
        message: 'Cập nhật buổi học thành công (Firebase placeholder)'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không mong muốn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Firebase placeholder - simulate deletion
      return res.status(200).json({
        success: true,
        message: 'Xóa buổi học thành công (Firebase placeholder)'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không mong muốn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }
}
