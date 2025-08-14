import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEmployeeRequests(req, res);
      case 'POST':
        return await createEmployeeRequest(req, res);
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

async function getEmployeeRequests(req: NextApiRequest, res: NextApiResponse) {
  const { employee_id, status, priority, limit = 50, offset = 0 } = req.query;

  let query = supabase
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
    .order('created_at', { ascending: false });

  if (employee_id) {
    query = query.eq('employee_id', employee_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (limit) {
    query = query.limit(parseInt(limit as string));
  }

  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách yêu cầu' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách yêu cầu thành công'
  });
}

async function createEmployeeRequest(req: NextApiRequest, res: NextApiResponse) {
  const { 
    employee_id, 
    status = 'pending',
    priority = 'medium', 
    due_date,
    data = {} 
  } = req.body;

  // Validate required fields
  if (!employee_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID nhân viên là bắt buộc' 
    });
  }

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trạng thái không hợp lệ' 
    });
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mức độ ưu tiên không hợp lệ' 
    });
  }

  try {
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        employee_id,
        status,
        priority,
        due_date,
        data
      })
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
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tạo yêu cầu mới' 
      });
    }

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Tạo yêu cầu mới thành công'
    });

  } catch (error) {
    console.error('Employee request creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo yêu cầu' 
    });
  }
}
