import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getFacilities(req, res);
      case 'POST':
        return await createFacility(req, res);
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

async function getFacilities(req: NextApiRequest, res: NextApiResponse) {
  const { status, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('facilities')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
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
      message: 'Không thể lấy danh sách cơ sở' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách cơ sở thành công'
  });
}

async function createFacility(req: NextApiRequest, res: NextApiResponse) {
  const { name, status = 'active', data = {} } = req.body;

  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên cơ sở là bắt buộc' 
    });
  }

  const { data: facility, error } = await supabase
    .from('facilities')
    .insert({
      name,
      status,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo cơ sở mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: facility,
    message: 'Tạo cơ sở mới thành công'
  });
}
