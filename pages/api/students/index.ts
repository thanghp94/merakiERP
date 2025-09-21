import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin, ROLES } from '../../../lib/auth/rbac';
import { COLLECTIONS, getTimestamp } from '../../../lib/firebase-admin';

// GET /api/students - View students (Teachers/Admins see all, Students see only themselves)
const getStudents = withAuth(async (req, res, { user, db }) => {
  const filters = {
    status: req.query.status as string,
    level: req.query.level as string,
    search: req.query.search as string,
    facility_id: req.query.facility_id as string,
    class_id: req.query.class_id as string,
    program_type: req.query.program_type as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  try {
    let query = db.collection(COLLECTIONS.STUDENTS);

    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.level && filters.level !== 'all') {
      query = query.where('data.level', '==', filters.level);
    }

    // Apply limit and offset
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    // Order by created_at descending
    query = query.orderBy('created_at', 'desc');

    const snapshot = await query.get();
    let students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply search filter (Firestore doesn't have case-insensitive text search)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      students = students.filter(student => 
        student.full_name?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm)
      );
    }

    // For students, they can only see their own data
    // For teachers/admins, they see all students
    if (user.role === ROLES.STUDENT) {
      students = students.filter(student => student.id === user.uid);
    }

    // If we need to join with enrollments/classes, fetch them separately
    const needsJoin = filters.facility_id || filters.class_id || filters.program_type;
    
    if (needsJoin) {
      // For each student, get their enrollments and filter based on criteria
      const studentsWithEnrollments = await Promise.all(
        students.map(async (student: any) => {
          try {
            // Get enrollments for this student
            const enrollmentSnapshot = await db
              .collection(COLLECTIONS.ENROLLMENTS)
              .where('student_id', '==', student.id)
              .where('status', '==', 'active')
              .get();

            const enrollments = enrollmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Get class details for each enrollment
            const enrichedEnrollments = await Promise.all(
              enrollments.map(async (enrollment: any) => {
                const classDoc = await db.collection(COLLECTIONS.CLASSES).doc(enrollment.class_id).get();
                if (classDoc.exists) {
                  const classData = { id: classDoc.id, ...classDoc.data() };
                  
                  // Apply filters
                  if (filters.facility_id && filters.facility_id !== 'all' && classData.facility_id !== filters.facility_id) {
                    return null;
                  }
                  if (filters.class_id && filters.class_id !== 'all' && classData.id !== filters.class_id) {
                    return null;
                  }
                  if (filters.program_type && filters.program_type !== 'all' && classData.data?.program_type !== filters.program_type) {
                    return null;
                  }

                  // Get facility details
                  const facilityDoc = await db.collection(COLLECTIONS.FACILITIES).doc(classData.facility_id).get();
                  const facilityData = facilityDoc.exists ? { id: facilityDoc.id, ...facilityDoc.data() } : null;

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

      students = studentsWithEnrollments.filter(s => s !== null);
    }

    return res.status(200).json({
      success: true,
      data: students || [],
      message: 'Students retrieved successfully',
      user_role: user.role,
      user_id: user.uid
    });

  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve students'
    });
  }
});

// POST /api/students - Create student (Teachers/Admins only)
const createStudent = withTeacherOrAdmin(async (req, res, { user, db }) => {
  const studentData = req.body;
  
  // Basic validation
  if (!studentData.full_name || !studentData.data?.parent?.name || !studentData.data?.parent?.phone) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: full_name, parent name, and parent phone are required'
    });
  }

  try {
    const newStudent = {
      ...studentData,
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };

    const docRef = await db.collection(COLLECTIONS.STUDENTS).add(newStudent);
    const createdStudent = { id: docRef.id, ...newStudent };

    return res.status(201).json({
      success: true,
      data: createdStudent,
      message: 'Student created successfully'
    });

  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create student'
    });
  }
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getStudents(req, res);
    case 'POST':
      return createStudent(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed` 
      });
  }
}