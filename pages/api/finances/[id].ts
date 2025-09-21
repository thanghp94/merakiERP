import { NextApiRequest, NextApiResponse } from 'next';

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
  // Mock finance data
  const mockFinance = {
    id: id,
    type: 'income',
    category: 'tuition',
    amount: 5000000,
    description: 'Học phí tháng 1',
    reference_id: 'student-1',
    reference_type: 'student',
    transaction_date: '2024-01-15',
    status: 'completed',
    data: { payment_method: 'bank_transfer' },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  };

  return res.status(200).json({
    success: true,
    data: mockFinance,
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

  // Mock updated finance
  const updatedFinance = {
    id: id,
    type: updateData.type || 'income',
    category: updateData.category || 'tuition',
    amount: updateData.amount || 5000000,
    description: updateData.description || 'Updated transaction',
    reference_id: updateData.reference_id || 'student-1',
    reference_type: updateData.reference_type || 'student',
    transaction_date: updateData.transaction_date || '2024-01-15',
    status: updateData.status || 'completed',
    data: updateData.data || { updated: true },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    data: updatedFinance,
    message: 'Cập nhật giao dịch thành công'
  });
}

async function deleteFinance(id: string, res: NextApiResponse) {
  // Mock finance deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa giao dịch thành công'
  });
}
