import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin } from '../../../lib/auth/rbac';
import { COLLECTIONS, getTimestamp } from '../../../lib/firebase-admin';

// GET /api/facilities - View facilities
const getFacilities = withAuth(async (req, res, { user, db }) => {
  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let query = db.collection(COLLECTIONS.FACILITIES);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by created_at descending
    query = query.orderBy('created_at', 'desc');

    // Apply limit and offset
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const snapshot = await query.get();
    const facilities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      data: facilities,
      message: 'Lấy danh sách cơ sở thành công'
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách cơ sở'
    });
  }
});

// POST /api/facilities - Create facility (Teachers/Admins only)
const createFacility = withTeacherOrAdmin(async (req, res, { user, db }) => {
  const { name, status = 'active', data = {} } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Tên cơ sở là bắt buộc'
    });
  }

  try {
    const newFacility = {
      name,
      status,
      data,
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };

    const docRef = await db.collection(COLLECTIONS.FACILITIES).add(newFacility);
    const createdFacility = { id: docRef.id, ...newFacility };

    return res.status(201).json({
      success: true,
      data: createdFacility,
      message: 'Tạo cơ sở mới thành công'
    });
  } catch (error) {
    console.error('Create facility error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo cơ sở mới'
    });
  }
});

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
