import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID cơ sở là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getFacility(id, res);
      case 'PUT':
        return await updateFacility(id, req, res);
      case 'DELETE':
        return await deleteFacility(id, res);
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

async function getFacility(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy cơ sở' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin cơ sở' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin cơ sở thành công'
  });
}

async function updateFacility(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { name, status, data } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: facility, error } = await supabase
    .from('facilities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy cơ sở' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật cơ sở' 
    });
  }

  return res.status(200).json({
    success: true,
    data: facility,
    message: 'Cập nhật cơ sở thành công'
  });
}

async function deleteFacility(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('facilities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa cơ sở' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa cơ sở thành công'
  });
}
