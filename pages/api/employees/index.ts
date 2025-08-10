import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

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

  let query = supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (position) {
    query = query.eq('position', position);
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
      message: 'Không thể lấy danh sách nhân viên' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
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

  const { data: employee, error } = await supabase
    .from('employees')
    .insert({
      full_name,
      position,
      department,
      status,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo nhân viên mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: employee,
    message: 'Tạo nhân viên mới thành công'
  });
}
