import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEnrollments(req, res);
      case 'POST':
        return await createEnrollment(req, res);
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

async function getEnrollments(req: NextApiRequest, res: NextApiResponse) {
  const { status, student_id, class_id, limit = 50, offset = 0 } = req.query;

  // Mock enrollments data
  const mockEnrollments = [
    {
      id: '1',
      student_id: 'student-1',
      class_id: 'class-1',
      enrollment_date: '2024-01-15',
      status: 'active',
      data: { payment_status: 'paid' },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      students: {
        id: 'student-1',
        full_name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        status: 'active'
      },
      classes: {
        id: 'class-1',
        class_name: 'English Basic A1',
        status: 'active',
        start_date: '2024-01-15',
        facilities: {
          id: 'facility-1',
          name: 'Trung tâm Quận 1'
        }
      }
    },
    {
      id: '2',
      student_id: 'student-2',
      class_id: 'class-1',
      enrollment_date: '2024-01-16',
      status: 'active',
      data: { payment_status: 'pending' },
      created_at: '2024-01-16T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
      students: {
        id: 'student-2',
        full_name: 'Trần Thị B',
        email: 'tranthib@email.com',
        phone: '0987654321',
        status: 'active'
      },
      classes: {
        id: 'class-1',
        class_name: 'English Basic A1',
        status: 'active',
        start_date: '2024-01-15',
        facilities: {
          id: 'facility-1',
          name: 'Trung tâm Quận 1'
        }
      }
    }
  ];

  // Apply filters
  let filteredEnrollments = mockEnrollments;

  if (status) {
    filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.status === status);
  }

  if (student_id) {
    filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.student_id === student_id);
  }

  if (class_id) {
    filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.class_id === class_id);
  }

  // Apply pagination
  const offsetNum = parseInt(offset as string);
  const limitNum = parseInt(limit as string);
  const paginatedEnrollments = filteredEnrollments.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    success: true,
    data: paginatedEnrollments,
    message: 'Lấy danh sách đăng ký thành công'
  });
}

async function createEnrollment(req: NextApiRequest, res: NextApiResponse) {
  const { student_id, class_id, enrollment_date, status = 'active', data = {} } = req.body;

  if (!student_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID học sinh là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  // Mock enrollment creation
  const newEnrollment = {
    id: `enrollment-${Date.now()}`,
    student_id,
    class_id,
    enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
    status,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    students: {
      id: student_id,
      full_name: 'Học sinh mới',
      email: 'student@email.com',
      phone: '0123456789',
      status: 'active'
    },
    classes: {
      id: class_id,
      class_name: 'Lớp học mới',
      status: 'active',
      start_date: '2024-01-15',
      facilities: {
        id: 'facility-1',
        name: 'Trung tâm Quận 1'
      }
    }
  };

  return res.status(201).json({
    success: true,
    data: newEnrollment,
    message: 'Tạo đăng ký mới thành công'
  });
}