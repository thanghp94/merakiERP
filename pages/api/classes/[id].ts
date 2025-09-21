import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getClass(id, res);
      case 'PUT':
        return await updateClass(id, req, res);
      case 'DELETE':
        return await deleteClass(id, res);
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

async function getClass(id: string, res: NextApiResponse) {
  // Mock class data
  const mockClass = {
    id: id,
    class_name: 'English Basic A1',
    facility_id: 'facility-1',
    status: 'active',
    start_date: '2024-01-15',
    data: {
      end_date: '2024-06-15',
      level: 'beginner',
      max_students: 20,
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '18:00-20:00'
      }
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  return res.status(200).json({
    success: true,
    data: mockClass,
    message: 'Lấy thông tin lớp học thành công'
  });
}

async function updateClass(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { class_name, facility_id, status, start_date, data } = req.body;

  const updateData: any = {};
  if (class_name !== undefined) updateData.class_name = class_name;
  if (facility_id !== undefined) updateData.facility_id = facility_id;
  if (status !== undefined) updateData.status = status;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // Mock updated class
  const updatedClass = {
    id: id,
    class_name: updateData.class_name || 'English Basic A1',
    facility_id: updateData.facility_id || 'facility-1',
    status: updateData.status || 'active',
    start_date: updateData.start_date || '2024-01-15',
    data: updateData.data || {
      end_date: '2024-06-15',
      level: 'beginner',
      max_students: 20,
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '18:00-20:00'
      }
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    data: updatedClass,
    message: 'Cập nhật lớp học thành công'
  });
}

async function deleteClass(id: string, res: NextApiResponse) {
  // Mock class deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa lớp học thành công'
  });
}