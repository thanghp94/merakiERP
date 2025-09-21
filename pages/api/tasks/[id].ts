import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID bài tập là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getTask(id, res);
      case 'PUT':
        return await updateTask(id, req, res);
      case 'DELETE':
        return await deleteTask(id, res);
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

async function getTask(id: string, res: NextApiResponse) {
  // Mock task data with related entities
  const mockTask = {
    id: id,
    title: 'Bài tập về nhà Unit 1',
    description: 'Hoàn thành bài tập trong sách giáo khoa trang 10-15',
    class_id: 'class-1',
    assigned_by: 'teacher-1',
    due_date: '2024-01-15',
    task_type: 'homework',
    status: 'active',
    data: { pages: '10-15', difficulty: 'medium' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    classes: {
      id: 'class-1',
      class_name: 'English Basic A1',
      status: 'active',
      facilities: {
        id: 'facility-1',
        name: 'Trung tâm Quận 1'
      }
    },
    employees: {
      id: 'teacher-1',
      full_name: 'Nguyễn Văn An',
      position: 'teacher',
      department: 'education'
    }
  };

  return res.status(200).json({
    success: true,
    data: mockTask,
    message: 'Lấy thông tin bài tập thành công'
  });
}

async function updateTask(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { title, description, class_id, assigned_by, due_date, task_type, status, data } = req.body;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (class_id !== undefined) updateData.class_id = class_id;
  if (assigned_by !== undefined) updateData.assigned_by = assigned_by;
  if (due_date !== undefined) updateData.due_date = due_date;
  if (task_type !== undefined) updateData.task_type = task_type;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  // Mock updated task with related entities
  const updatedTask = {
    id: id,
    title: updateData.title || 'Bài tập về nhà Unit 1',
    description: updateData.description || 'Hoàn thành bài tập trong sách giáo khoa trang 10-15',
    class_id: updateData.class_id || 'class-1',
    assigned_by: updateData.assigned_by || 'teacher-1',
    due_date: updateData.due_date || '2024-01-15',
    task_type: updateData.task_type || 'homework',
    status: updateData.status || 'active',
    data: updateData.data || { pages: '10-15', difficulty: 'medium' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    classes: {
      id: updateData.class_id || 'class-1',
      class_name: 'English Basic A1',
      status: 'active',
      facilities: {
        id: 'facility-1',
        name: 'Trung tâm Quận 1'
      }
    },
    employees: {
      id: updateData.assigned_by || 'teacher-1',
      full_name: 'Nguyễn Văn An',
      position: 'teacher',
      department: 'education'
    }
  };

  return res.status(200).json({
    success: true,
    data: updatedTask,
    message: 'Cập nhật bài tập thành công'
  });
}

async function deleteTask(id: string, res: NextApiResponse) {
  // Mock task deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa bài tập thành công'
  });
}