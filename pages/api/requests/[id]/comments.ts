import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID yêu cầu không hợp lệ' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getComments(req, res, id);
      case 'POST':
        return await createComment(req, res, id);
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

async function getComments(req: NextApiRequest, res: NextApiResponse, requestId: string) {
  // First verify the request exists
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('id')
    .eq('id', requestId)
    .single();

  if (requestError) {
    console.error('Request verification error:', requestError);
    if (requestError.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy yêu cầu' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể kiểm tra yêu cầu' 
    });
  }

  // For now, return empty comments since request_comments table doesn't exist in current schema
  return res.status(200).json({
    success: true,
    data: [],
    message: 'Lấy danh sách bình luận thành công (chức năng bình luận chưa được triển khai)'
  });
}

async function createComment(req: NextApiRequest, res: NextApiResponse, requestId: string) {
  const { comment, employee_id } = req.body;

  // Validate required fields
  if (!comment || comment.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      message: 'Nội dung bình luận là bắt buộc' 
    });
  }

  if (!employee_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID nhân viên là bắt buộc' 
    });
  }

  // First verify the request exists
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('id, employee_id')
    .eq('id', requestId)
    .single();

  if (requestError) {
    console.error('Request verification error:', requestError);
    if (requestError.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy yêu cầu' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể kiểm tra yêu cầu' 
    });
  }

  // Verify the employee exists
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('id', employee_id)
    .single();

  if (employeeError) {
    console.error('Employee verification error:', employeeError);
    if (employeeError.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy nhân viên' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể kiểm tra nhân viên' 
    });
  }

  // For now, return a mock comment since request_comments table doesn't exist
  return res.status(201).json({
    success: true,
    data: {
      id: `mock-comment-${Date.now()}`,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
      employee: {
        id: employee_id,
        full_name: employee.full_name,
        position: 'Employee'
      }
    },
    message: 'Tạo bình luận thành công (chức năng bình luận chưa được triển khai đầy đủ)'
  });
}
