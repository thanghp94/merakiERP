import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseAdmin, COLLECTIONS } from '@/lib/firebase-admin';

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
  const {
    status,
    level,
    search,
    facility_id,
    class_id,
    program_type,
    payment_status,
    due_month,
    due_year,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    // Build filters for Firestore query
    const filters: any = {
      orderBy: { field: 'created_at', direction: 'desc' },
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const whereConditions: any[] = [];

    // Apply status filter
    if (status) {
      whereConditions.push(['status', '==', status]);
    }

    // Apply level filter
    if (level && level !== 'all') {
      whereConditions.push(['data.level', '==', level]);
    }

    if (whereConditions.length > 0) {
      filters.where = whereConditions;
    }

    // Get students from Firestore
    const result = await FirebaseAdmin.getCollection(COLLECTIONS.STUDENTS, filters);

    if (!result.success) {
      console.error('Firebase error:', result.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể lấy danh sách học sinh' 
      });
    }

    let processedData = result.data || [];

    // Apply search filter (client-side since Firestore doesn't support LIKE queries)
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      processedData = processedData.filter((student: any) => 
        student.full_name?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm)
      );
    }

    // If we need to join with enrollments/classes, fetch them separately
    const needsJoin = facility_id || class_id || program_type;
    
    if (needsJoin) {
      // For each student, get their enrollments and filter based on criteria
      const studentsWithEnrollments = await Promise.all(
        processedData.map(async (student: any) => {
          try {
            // Get enrollments for this student
            const enrollmentFilters = {
              where: [
                ['student_id', '==', student.id],
                ['status', '==', 'active']
              ]
            };

            const enrollmentResult = await FirebaseAdmin.getCollection(COLLECTIONS.ENROLLMENTS, enrollmentFilters);
            const enrollments = enrollmentResult.success ? enrollmentResult.data : [];

            // Get class details for each enrollment
            const enrichedEnrollments = await Promise.all(
              enrollments.map(async (enrollment: any) => {
                const classResult = await FirebaseAdmin.getDocument(COLLECTIONS.CLASSES, enrollment.class_id);
                if (classResult.success) {
                  const classData = classResult.data;
                  
                  // Apply filters
                  if (facility_id && facility_id !== 'all' && classData.facility_id !== facility_id) {
                    return null;
                  }
                  if (class_id && class_id !== 'all' && classData.id !== class_id) {
                    return null;
                  }
                  if (program_type && program_type !== 'all' && classData.data?.program_type !== program_type) {
                    return null;
                  }

                  // Get facility details
                  const facilityResult = await FirebaseAdmin.getDocument(COLLECTIONS.FACILITIES, classData.facility_id);
                  const facilityData = facilityResult.success ? facilityResult.data : null;

                  return {
                    ...enrollment,
                    classes: {
                      ...classData,
                      facilities: facilityData
                    }
                  };
                }
                return null;
              })
            );

            const validEnrollments = enrichedEnrollments.filter(e => e !== null);

            if (validEnrollments.length > 0) {
              return {
                ...student,
                current_enrollments: validEnrollments,
                enrollments: validEnrollments
              };
            }
            return null;
          } catch (error) {
            console.error('Error processing student enrollments:', error);
            return null;
          }
        })
      );

      processedData = studentsWithEnrollments.filter(s => s !== null);
    }

    return res.status(200).json({
      success: true,
      data: processedData,
      message: 'Lấy danh sách học sinh thành công'
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách học sinh' 
    });
  }
}

async function createStudent(req: NextApiRequest, res: NextApiResponse) {
  const { full_name, email, phone, status = 'active', data = {} } = req.body;

  if (!full_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên học sinh là bắt buộc' 
    });
  }

  try {
    const result = await FirebaseAdmin.createDocument(COLLECTIONS.STUDENTS, {
      full_name,
      email,
      phone,
      status,
      data
    });

    if (!result.success) {
      console.error('Firebase error:', result.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tạo học sinh mới' 
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: 'Tạo học sinh mới thành công'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo học sinh mới' 
    });
  }
}
