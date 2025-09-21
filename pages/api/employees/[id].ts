import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID nhân viên là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getEmployee(id, res);
      case 'PUT':
        return await updateEmployee(id, req, res);
      case 'DELETE':
        return await deleteEmployee(id, res);
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

async function getEmployee(id: string, res: NextApiResponse) {
  // Mock employee data
  const mockEmployee = {
    id: id,
    full_name: 'Nguyễn Văn An',
    position: 'teacher',
    department: 'education',
    status: 'active',
    data: {
      email: 'nguyenvanan@email.com',
      phone: '0123456789',
      hire_date: '2024-01-01',
      salary: 15000000
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  return res.status(200).json({
    success: true,
    data: mockEmployee,
    message: 'Lấy thông tin nhân viên thành công'
  });
}

async function updateEmployee(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { full_name, position, department, status, data } = req.body;

  const updateData: any = {};
  if (full_name !== undefined) updateData.full_name = full_name;
  if (position !== undefined) updateData.position = position;
  if (department !== undefined) updateData.department = department;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // Mock updated employee
  const updatedEmployee = {
    id: id,
    full_name: updateData.full_name || 'Nguyễn Văn An',
    position: updateData.position || 'teacher',
    department: updateData.department || 'education',
    status: updateData.status || 'active',
    data: updateData.data || {
      email: 'nguyenvanan@email.com',
      phone: '0123456789',
      hire_date: '2024-01-01',
      salary: 15000000
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    data: updatedEmployee,
    message: 'Cập nhật nhân viên thành công'
  });
}

async function deleteEmployee(id: string, res: NextApiResponse) {
  // Mock employee deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa nhân viên thành công'
  });
}