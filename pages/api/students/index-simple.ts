import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getStudents(req, res);
      case 'POST':
        return await createStudent(req, res);
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

async function getStudents(req: NextApiRequest, res: NextApiResponse) {
  const { status, level, search, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (level && level !== 'all') {
    query = query.eq('data->>level', level);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
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
      message: 'Không thể lấy danh sách học sinh' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách học sinh thành công'
  });
}

async function createStudent(req: NextApiRequest, res: NextApiResponse) {
  const { full_name, email, phone, status = 'active', data = {} } = req.body;

  if (!full_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên học sinh là bắt buộc' 
    });
  }

  const { data: student, error } = await supabase
    .from('students')
    .insert({
      full_name,
      email,
      phone,
      status,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo học sinh mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: student,
    message: 'Tạo học sinh mới thành công'
  });
}
