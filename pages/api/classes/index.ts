import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin, ROLES } from '../../../lib/auth/rbac';
import { COLLECTIONS, getTimestamp } from '../../../lib/firebase-admin';

// GET /api/classes - View classes
const getClasses = withAuth(async (req, res, { user, db }) => {
  const { status, facility_id, limit = 50, offset = 0 } = req.query;

  try {
    let query = db.collection(COLLECTIONS.CLASSES);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (facility_id) {
      query = query.where('facility_id', '==', facility_id);
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
    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get facility information for each class
    const classesWithFacilities = await Promise.all(
      classes.map(async (classDoc) => {
        if (classDoc.facility_id) {
          try {
            const facilityDoc = await db.collection(COLLECTIONS.FACILITIES).doc(classDoc.facility_id).get();
            if (facilityDoc.exists) {
              return {
                ...classDoc,
                facilities: {
                  id: facilityDoc.id,
                  ...facilityDoc.data()
                }
              };
            }
          } catch (error) {
            console.error('Error fetching facility:', error);
          }
        }
        return classDoc;
      })
    );

    return res.status(200).json({
      success: true,
      data: classesWithFacilities,
      message: 'Lấy danh sách lớp học thành công'
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách lớp học'
    });
  }
});

// POST /api/classes - Create class (Teachers/Admins only)
const createClass = withTeacherOrAdmin(async (req, res, { user, db }) => {
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

  try {
    const newClass = {
      class_name,
      facility_id,
      status,
      start_date,
      data,
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };

    const docRef = await db.collection(COLLECTIONS.CLASSES).add(newClass);
    
    // Get the created class with facility information
    let createdClass = { id: docRef.id, ...newClass };
    
    if (facility_id) {
      try {
        const facilityDoc = await db.collection(COLLECTIONS.FACILITIES).doc(facility_id).get();
        if (facilityDoc.exists) {
          createdClass = {
            ...createdClass,
            facilities: {
              id: facilityDoc.id,
              ...facilityDoc.data()
            }
          };
        }
      } catch (error) {
        console.error('Error fetching facility for created class:', error);
      }
    }

    return res.status(201).json({
      success: true,
      data: createdClass,
      message: 'Tạo lớp học mới thành công'
    });
  } catch (error) {
    console.error('Create class error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo lớp học mới'
    });
  }
});

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
