import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

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
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy nhân viên' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin nhân viên' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
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

  const { data: employee, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy nhân viên' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật nhân viên' 
    });
  }

  return res.status(200).json({
    success: true,
    data: employee,
    message: 'Cập nhật nhân viên thành công'
  });
}

async function deleteEmployee(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa nhân viên' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa nhân viên thành công'
  });
}
