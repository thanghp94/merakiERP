import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'ID giao dịch là bắt buộc' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getFinance(id, res);
      case 'PUT':
        return await updateFinance(id, req, res);
      case 'DELETE':
        return await deleteFinance(id, res);
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

async function getFinance(id: string, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('finances')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy giao dịch' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy thông tin giao dịch' 
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Lấy thông tin giao dịch thành công'
  });
}

async function updateFinance(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { type, category, amount, description, reference_id, reference_type, transaction_date, status, data } = req.body;

  const updateData: any = {};
  if (type !== undefined) updateData.type = type;
  if (category !== undefined) updateData.category = category;
  if (amount !== undefined) updateData.amount = amount;
  if (description !== undefined) updateData.description = description;
  if (reference_id !== undefined) updateData.reference_id = reference_id;
  if (reference_type !== undefined) updateData.reference_type = reference_type;
  if (transaction_date !== undefined) updateData.transaction_date = transaction_date;
  if (status !== undefined) updateData.status = status;
  if (data !== undefined) updateData.data = data;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Không có trường hợp lệ để cập nhật' 
    });
  }

  const { data: finance, error } = await supabase
    .from('finances')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy giao dịch' 
      });
    }
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật giao dịch' 
    });
  }

  return res.status(200).json({
    success: true,
    data: finance,
    message: 'Cập nhật giao dịch thành công'
  });
}

async function deleteFinance(id: string, res: NextApiResponse) {
  const { error } = await supabase
    .from('finances')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa giao dịch' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Xóa giao dịch thành công'
  });
}
