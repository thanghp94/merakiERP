import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getFinances(req, res);
      case 'POST':
        return await createFinance(req, res);
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

async function getFinances(req: NextApiRequest, res: NextApiResponse) {
  const { 
    type, 
    category, 
    status, 
    reference_type, 
    reference_id,
    start_date,
    end_date,
    limit = 50, 
    offset = 0 
  } = req.query;

  let query = supabase
    .from('finances')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (reference_type) {
    query = query.eq('reference_type', reference_type);
  }

  if (reference_id) {
    query = query.eq('reference_id', reference_id);
  }

  if (start_date) {
    query = query.gte('transaction_date', start_date);
  }

  if (end_date) {
    query = query.lte('transaction_date', end_date);
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
      message: 'Không thể lấy danh sách tài chính' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy danh sách tài chính thành công'
  });
}

async function createFinance(req: NextApiRequest, res: NextApiResponse) {
  const { 
    type, 
    category, 
    amount, 
    description, 
    reference_id, 
    reference_type, 
    transaction_date, 
    status = 'completed', 
    data = {} 
  } = req.body;

  if (!type) {
    return res.status(400).json({ 
      success: false, 
      message: 'Loại giao dịch là bắt buộc' 
    });
  }

  if (!category) {
    return res.status(400).json({ 
      success: false, 
      message: 'Danh mục là bắt buộc' 
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Số tiền phải lớn hơn 0' 
    });
  }

  const { data: finance, error } = await supabase
    .from('finances')
    .insert({
      type,
      category,
      amount: parseFloat(amount),
      description,
      reference_id,
      reference_type,
      transaction_date: transaction_date || new Date().toISOString().split('T')[0],
      status,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo giao dịch tài chính mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: finance,
    message: 'Tạo giao dịch tài chính mới thành công'
  });
}
