import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseAdmin, COLLECTIONS } from '@/lib/firebase-admin';

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

  try {
    const filters: any = {
      orderBy: { field: 'created_at', direction: 'desc' },
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const whereConditions: any[] = [];

    if (status) {
      whereConditions.push(['status', '==', status]);
    }

    if (whereConditions.length > 0) {
      filters.where = whereConditions;
    }

    const result = await FirebaseAdmin.getCollection(COLLECTIONS.FACILITIES, filters);

    if (!result.success) {
      console.error('Firebase error:', result.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể lấy danh sách cơ sở' 
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data || [],
      message: 'Lấy danh sách cơ sở thành công'
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách cơ sở' 
    });
  }
}

async function createFacility(req: NextApiRequest, res: NextApiResponse) {
  const { name, status = 'active', data = {} } = req.body;

  if (!name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên cơ sở là bắt buộc' 
    });
  }

  try {
    const result = await FirebaseAdmin.createDocument(COLLECTIONS.FACILITIES, {
      name,
      status,
      data
    });

    if (!result.success) {
      console.error('Firebase error:', result.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tạo cơ sở mới' 
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: 'Tạo cơ sở mới thành công'
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo cơ sở mới' 
    });
  }
}
