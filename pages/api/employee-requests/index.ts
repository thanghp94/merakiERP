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
  const { employee_id, status, type, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('employee_requests')
    .select(`
      *,
      employees!employee_requests_employee_id_fkey (
        id,
        full_name,
        data
      ),
      approved_by_employee:employees!employee_requests_approved_by_fkey (
        id,
        full_name,
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

  if (type) {
    query = query.eq('type', type);
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
    type, 
    title, 
    description, 
    start_date, 
    end_date,
    data = {} 
  } = req.body;

  // Validate required fields
  if (!employee_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID nhân viên là bắt buộc' 
    });
  }

  if (!type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Loại yêu cầu là bắt buộc' 
    });
  }

  if (!title) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tiêu đề yêu cầu là bắt buộc' 
    });
  }

  if (!start_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ngày bắt đầu là bắt buộc' 
    });
  }

  // Validate type
  const validTypes = ['leave', 'permission', 'sick', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Loại yêu cầu không hợp lệ' 
    });
  }

  try {
    const { data: request, error } = await supabase
      .from('employee_requests')
      .insert({
        employee_id,
        type,
        title,
        description,
        start_date,
        end_date,
        status: 'pending',
        data
      })
      .select(`
        *,
        employees!employee_requests_employee_id_fkey (
          id,
          full_name,
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
