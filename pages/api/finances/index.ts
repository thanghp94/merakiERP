import { NextApiRequest, NextApiResponse } from 'next';

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

  // Mock finances data
  const mockFinances = [
    {
      id: '1',
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
    },
    {
      id: '2',
      type: 'expense',
      category: 'salary',
      amount: 15000000,
      description: 'Lương giáo viên tháng 1',
      reference_id: 'teacher-1',
      reference_type: 'employee',
      transaction_date: '2024-01-31',
      status: 'completed',
      data: { pay_period: '2024-01' },
      created_at: '2024-01-31T00:00:00Z',
      updated_at: '2024-01-31T00:00:00Z'
    },
    {
      id: '3',
      type: 'expense',
      category: 'utilities',
      amount: 2000000,
      description: 'Tiền điện nước tháng 1',
      reference_id: 'facility-1',
      reference_type: 'facility',
      transaction_date: '2024-01-20',
      status: 'pending',
      data: { provider: 'EVN' },
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z'
    }
  ];

  // Apply filters
  let filteredFinances = mockFinances;

  if (type) {
    filteredFinances = filteredFinances.filter(finance => finance.type === type);
  }

  if (category) {
    filteredFinances = filteredFinances.filter(finance => finance.category === category);
  }

  if (status) {
    filteredFinances = filteredFinances.filter(finance => finance.status === status);
  }

  if (reference_type) {
    filteredFinances = filteredFinances.filter(finance => finance.reference_type === reference_type);
  }

  if (reference_id) {
    filteredFinances = filteredFinances.filter(finance => finance.reference_id === reference_id);
  }

  if (start_date) {
    filteredFinances = filteredFinances.filter(finance => finance.transaction_date >= start_date);
  }

  if (end_date) {
    filteredFinances = filteredFinances.filter(finance => finance.transaction_date <= end_date);
  }

  // Apply pagination
  const offsetNum = parseInt(offset as string);
  const limitNum = parseInt(limit as string);
  const paginatedFinances = filteredFinances.slice(offsetNum, offsetNum + limitNum);

  return res.status(200).json({
    success: true,
    data: paginatedFinances,
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

  // Mock finance creation
  const newFinance = {
    id: `finance-${Date.now()}`,
    type,
    category,
    amount: parseFloat(amount),
    description,
    reference_id,
    reference_type,
    transaction_date: transaction_date || new Date().toISOString().split('T')[0],
    status,
    data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    data: newFinance,
    message: 'Tạo giao dịch tài chính mới thành công'
  });
}
