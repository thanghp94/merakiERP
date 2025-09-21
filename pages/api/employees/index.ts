import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEmployees(req, res);
      case 'POST':
        return await createEmployee(req, res);
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

async function getEmployees(req: NextApiRequest, res: NextApiResponse) {
  const { status, department, position, limit = 50, offset = 0 } = req.query;

  // Mock employees data
  const mockEmployees = [
    {
      id: '1',
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
    },
    {
      id: '2',
      full_name: 'Trần Thị Bình',
      position: 'assistant',
      department: 'education',
      status: 'active',
      data: {
        email: 'tranthibinh@email.com',
        phone: '0987654321',
        hire_date: '2024-01-15',
        salary: 8000000
      },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ];

  // Apply filters
  let filteredEmployees = mockEmployees;

  if (status) {
    filteredEmployees = filteredEmployees.filter(employee => employee.status === status);
  }

  if (department) {
    filteredEmployees = filteredEmployees.filter(employee => employee.department === department);
  }

  if (position) {
    filteredEmployees = filteredEmployees.filter(employee => employee.position === position);
  }

  // Apply pagination
  const offsetNum = parseInt(offset as string);
  const limitNum = parseInt(limit as string);
  const paginatedEmployees = filteredEmployees.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    success: true,
    data: paginatedEmployees,
    message: 'Lấy danh sách nhân viên thành công'
  });
}

async function createEmployee(req: NextApiRequest, res: NextApiResponse) {
  const { full_name, position, department, status = 'active', data = {} } = req.body;

  if (!full_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên nhân viên là bắt buộc' 
    });
  }

  if (!position) {
    return res.status(400).json({ 
      success: false, 
      message: 'Chức vụ là bắt buộc' 
    });
  }

  if (!department) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phòng ban là bắt buộc' 
    });
  }

  // Mock employee creation
  const newEmployee = {
    id: `employee-${Date.now()}`,
    full_name,
    position,
    department,
    status,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    data: newEmployee,
    message: 'Tạo nhân viên mới thành công'
  });
}