import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

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
        return await getRequest(req, res, id);
      case 'PATCH':
        return await updateRequest(req, res, id);
      case 'DELETE':
        return await deleteRequest(req, res, id);
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
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

async function getRequest(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { data: request, error } = await supabase
    .from('requests')
    .select(`
      *,
      employee:employees!requests_employee_id_fkey (
        id,
        full_name,
        position,
        data
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy yêu cầu' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin yêu cầu' 
    });
  }

  return res.status(200).json({
    success: true,
    data: request,
    message: 'Lấy thông tin yêu cầu thành công'
  });
}

async function updateRequest(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { 
    status, 
    priority, 
    due_date,
    data: requestData,
    rejection_reason 
  } = req.body;

  // Build update object dynamically
  const updateData: any = {};

  if (status !== undefined) {
    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trạng thái không hợp lệ' 
      });
    }
    updateData.status = status;
  }

  if (priority !== undefined) {
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mức độ ưu tiên không hợp lệ' 
      });
    }
    updateData.priority = priority;
  }

  if (due_date !== undefined) {
    updateData.due_date = due_date;
  }

  if (requestData !== undefined) {
    updateData.data = requestData;
  }

  // Handle rejection reason
  if (status === 'rejected' && rejection_reason) {
    updateData.data = {
      ...updateData.data,
      rejection_reason
    };
  }

  try {
    const { data: request, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        employee:employees!requests_employee_id_fkey (
          id,
          full_name,
          position,
          data
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy yêu cầu' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể cập nhật yêu cầu' 
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
      message: 'Cập nhật yêu cầu thành công'
    });

  } catch (error) {
    console.error('Request update error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật yêu cầu' 
    });
  }
}

async function deleteRequest(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // First check if request exists and is in pending status
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('status, employee_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      if (fetchError.code === 'PGRST116') {
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

    // Only allow deletion of pending requests
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Chỉ có thể xóa yêu cầu đang chờ duyệt' 
      });
    }

    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể xóa yêu cầu' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa yêu cầu thành công'
    });

  } catch (error) {
    console.error('Request deletion error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xóa yêu cầu' 
    });
  }
}
