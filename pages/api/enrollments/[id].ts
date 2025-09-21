import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID đăng ký là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEnrollment(id, res);
      case 'PUT':
        return await updateEnrollment(id, req, res);
      case 'DELETE':
        return await deleteEnrollment(id, res);
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

async function getEnrollment(id: string, res: NextApiResponse) {
  // Mock enrollment data
  const mockEnrollment = {
    id: id,
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
  };

  return res.status(200).json({
    success: true,
    data: mockEnrollment,
    message: 'Lấy thông tin đăng ký thành công'
  });
}

async function updateEnrollment(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { student_id, class_id, enrollment_date, status, data } = req.body;

  const updateData: any = {};
  if (student_id !== undefined) updateData.student_id = student_id;
  if (class_id !== undefined) updateData.class_id = class_id;
  if (enrollment_date !== undefined) updateData.enrollment_date = enrollment_date;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // Mock updated enrollment
  const updatedEnrollment = {
    id: id,
    student_id: updateData.student_id || 'student-1',
    class_id: updateData.class_id || 'class-1',
    enrollment_date: updateData.enrollment_date || '2024-01-15',
    status: updateData.status || 'active',
    data: updateData.data || { payment_status: 'paid' },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
    students: {
      id: updateData.student_id || 'student-1',
      full_name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0123456789',
      status: 'active'
    },
    classes: {
      id: updateData.class_id || 'class-1',
      class_name: 'English Basic A1',
      status: 'active',
      start_date: '2024-01-15',
      facilities: {
        id: 'facility-1',
        name: 'Trung tâm Quận 1'
      }
    }
  };

  return res.status(200).json({
    success: true,
    data: updatedEnrollment,
    message: 'Cập nhật đăng ký thành công'
  });
}

async function deleteEnrollment(id: string, res: NextApiResponse) {
  // Mock enrollment deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa đăng ký thành công'
  });
}