import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getTasks(req, res);
      case 'POST':
        return await createTask(req, res);
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

async function getTasks(req: NextApiRequest, res: NextApiResponse) {
  const { 
    class_id, 
    assigned_by, 
    task_type, 
    status, 
    due_date,
    overdue,
    limit = 50, 
    offset = 0 
  } = req.query;

  // Mock tasks data
  const mockTasks = [
    {
      id: '1',
      title: 'Bài tập về nhà Unit 1',
      description: 'Hoàn thành bài tập trong sách giáo khoa trang 10-15',
      class_id: 'class-1',
      assigned_by: 'teacher-1',
      due_date: '2024-01-15',
      task_type: 'homework',
      status: 'active',
      data: { pages: '10-15' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Kiểm tra giữa kỳ',
      description: 'Kiểm tra kiến thức Units 1-3',
      class_id: 'class-1',
      assigned_by: 'teacher-1',
      due_date: '2024-01-20',
      task_type: 'exam',
      status: 'active',
      data: { duration: '60 minutes' },
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'Thuyết trình nhóm',
      description: 'Thuyết trình về chủ đề Family',
      class_id: 'class-2',
      assigned_by: 'teacher-2',
      due_date: '2024-01-25',
      task_type: 'presentation',
      status: 'active',
      data: { group_size: 4 },
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ];

  // Apply filters
  let filteredTasks = mockTasks;

  if (class_id) {
    filteredTasks = filteredTasks.filter(task => task.class_id === class_id);
  }

  if (assigned_by) {
    filteredTasks = filteredTasks.filter(task => task.assigned_by === assigned_by);
  }

  if (task_type) {
    filteredTasks = filteredTasks.filter(task => task.task_type === task_type);
  }

  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status);
  }

  if (due_date) {
    filteredTasks = filteredTasks.filter(task => task.due_date === due_date);
  }

  if (overdue === 'true') {
    const today = new Date().toISOString().split('T')[0];
    filteredTasks = filteredTasks.filter(task => 
      task.due_date < today && task.status === 'active'
    );
  }

  // Apply pagination
  const offsetNum = parseInt(offset as string);
  const limitNum = parseInt(limit as string);
  const paginatedTasks = filteredTasks.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    success: true,
    data: paginatedTasks,
    message: 'Lấy danh sách bài tập thành công'
  });
}

async function createTask(req: NextApiRequest, res: NextApiResponse) {
  const { 
    title, 
    description, 
    class_id, 
    assigned_by, 
    due_date, 
    task_type = 'homework', 
    status = 'active', 
    data = {} 
  } = req.body;

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tiêu đề bài tập là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  // Mock task creation
  const newTask = {
    id: `task-${Date.now()}`,
    title,
    description,
    class_id,
    assigned_by,
    due_date,
    task_type,
    status,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    data: newTask,
    message: 'Tạo bài tập mới thành công'
  });
}
