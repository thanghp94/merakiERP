import { NextApiRequest, NextApiResponse } from 'next';

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
  // Mock facility data
  const mockFacility = {
    id: id,
    name: 'Trung tâm Tiếng Anh Quận 1',
    status: 'active',
    data: {
      address: '123 Nguyễn Huệ , Quận 1, TP.HCM',
      phone: '028-123-4567',
      capacity: 200,
      facilities: ['wifi', 'projector', 'air_conditioning']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  return res.status(200).json({
    success: true,
    data: mockFacility,
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

  // Mock updated facility
  const updatedFacility = {
    id: id,
    name: updateData.name || 'Trung tâm Tiếng Anh Quận 1',
    status: updateData.status || 'active',
    data: updateData.data || {
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '028-123-4567',
      capacity: 200,
      facilities: ['wifi', 'projector', 'air_conditioning']
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    data: updatedFacility,
    message: 'Cập nhật cơ sở thành công'
  });
}

async function deleteFacility(id: string, res: NextApiResponse) {
  // Mock facility deletion - always successful
  return res.status(200).json({
    success: true,
    message: 'Xóa cơ sở thành công'
  });
}
