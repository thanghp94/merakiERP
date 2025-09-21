import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(req, res);
      case 'POST':
        if (req.body.bulk_create) {
          return await createBulkAttendance(req, res);
        }
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
  const { main_session_id, enrollment_id, status, date, limit = 50, offset = 0 } = req.query;

  // Mock attendance data
  const mockAttendance = [
    {
      id: '1',
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
          email: 'nguyenvana@email.com'
        }
      }
    },
    {
      id: '2',
      main_session_id: 'main-session-1',
      enrollment_id: 'enrollment-2',
      status: 'absent',
      data: { reason: 'sick' },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      enrollments: {
        id: 'enrollment-2',
        students: {
          id: 'student-2',
          full_name: 'Trần Thị B',
          email: 'tranthib@email.com'
        }
      }
    }
  ];

  // Apply filters
  let filteredAttendance = mockAttendance;

  if (main_session_id) {
    filteredAttendance = filteredAttendance.filter(attendance => attendance.main_session_id === main_session_id);
  }

  if (enrollment_id) {
    filteredAttendance = filteredAttendance.filter(attendance => attendance.enrollment_id === enrollment_id);
  }

  if (status) {
    filteredAttendance = filteredAttendance.filter(attendance => attendance.status === status);
  }

  // Apply pagination
  const offsetNum = parseInt(offset as string);
  const limitNum = parseInt(limit as string);
  const paginatedAttendance = filteredAttendance.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    success: true,
    data: paginatedAttendance,
    message: 'Lấy danh sách điểm danh thành công'
  });
}

async function createAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { main_session_id, enrollment_id, status = 'present', data = {} } = req.body;

  if (!main_session_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học chính là bắt buộc' 
    });
  }

  if (!enrollment_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID đăng ký là bắt buộc' 
    });
  }

  // Mock attendance creation
  const newAttendance = {
    id: `attendance-${Date.now()}`,
    main_session_id,
    enrollment_id,
    status,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    enrollments: {
      id: enrollment_id,
      students: {
        id: 'student-1',
        full_name: 'Học sinh mới',
        email: 'student@email.com'
      }
    }
  };

  return res.status(201).json({
    success: true,
    data: newAttendance,
    message: 'Tạo điểm danh mới thành công'
  });
}

async function createBulkAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { main_session_id, class_id } = req.body;

  if (!main_session_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học chính là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  // Mock bulk attendance creation
  const bulkAttendance = [
    {
      id: `attendance-${Date.now()}-1`,
      main_session_id,
      enrollment_id: 'enrollment-1',
      status: 'present',
      data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enrollments: {
        id: 'enrollment-1',
        students: {
          id: 'student-1',
          full_name: 'Nguyễn Văn A',
          email: 'nguyenvana@email.com'
        }
      }
    },
    {
      id: `attendance-${Date.now()}-2`,
      main_session_id,
      enrollment_id: 'enrollment-2',
      status: 'present',
      data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enrollments: {
        id: 'enrollment-2',
        students: {
          id: 'student-2',
          full_name: 'Trần Thị B',
          email: 'tranthib@email.com'
        }
      }
    }
  ];

  return res.status(201).json({
    success: true,
    data: bulkAttendance,
    message: `Đã tạo điểm danh cho ${bulkAttendance.length} học sinh`
  });
}