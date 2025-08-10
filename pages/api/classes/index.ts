import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getClasses(req, res);
      case 'POST':
        return await createClass(req, res);
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

async function getClasses(req: NextApiRequest, res: NextApiResponse) {
  const { status, facility_id, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('classes')
    .select(`
      *,
      facilities (
        id,
        name,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (facility_id) {
    query = query.eq('facility_id', facility_id);
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
      message: 'Không thể lấy danh sách lớp học' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách lớp học thành công'
  });
}

async function createClass(req: NextApiRequest, res: NextApiResponse) {
  const { class_name, facility_id, status = 'active', start_date, data = {} } = req.body;

  if (!class_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên lớp học là bắt buộc' 
    });
  }

  if (!start_date) {
    return res.status(400).json({ 
      success: false, 
      message: 'Ngày bắt đầu là bắt buộc' 
    });
  }

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      class_name,
      facility_id,
      status,
      start_date,
      data
    })
    .select(`
      *,
      facilities (
        id,
        name,
        status
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo lớp học mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: newClass,
    message: 'Tạo lớp học mới thành công'
  });
}
