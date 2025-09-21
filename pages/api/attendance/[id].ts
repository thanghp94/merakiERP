import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID điểm danh là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(id, res);
      case 'PUT':
        return await updateAttendance(id, req, res);
      case 'DELETE':
        return await deleteAttendance(id, res);
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

async function getAttendance(id: string, res: NextApiResponse) {
  // Mock attendance data
  const mockAttendance = {
    id: id,
    main_session_id: 'main-session-1',
    enrollment_id: 'enrollment-1',
    status: 'present',
    data: { arrived_at: '09:00', notes: 'On time' },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    enrollments: {
      id: 'enrollment-1',
      students: {
        id: 'student-1',
        full_name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789'
      }
    }
  };

  return res.status(200).json({
    success: true,
    data: mockAttendance,
    message: 'Lấy thông tin điểm danh thành công'
  });
}

async function updateAttendance(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { session_id, enrollment_id, status, data } = req.body;

  const updateData: any = {};
  if (session_id !== undefined) updateData.session_id = session_id;
  if (enrollment_id !== undefined) updateData.enrollment_id = enrollment_id;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // Mock updated attendance
  const updatedAttendance = {
    id: id,
    main_session_id: 'main-session-1',
    enrollment_id: updateData.enrollment_id || 'enrollment-1',
    status: updateData.status || 'present',
    data: updateData.data || { arrived_at: '09:00', notes: 'Updated' },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
    enrollments: {
      id: updateData.enrollment_id || 'enrollment-1',
      students: {
        id: 'student-1',
        full_name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789'
      }
    }
  };

  return res.status(200).json({
    success: true,
    data: updatedAttendance,
    message: 'Cập nhật điểm danh thành công'
  });
}

async function deleteAttendance(id: string, res: NextApiResponse) {
  // Mock attendance deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa điểm danh thành công'
  });
}