import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin, ROLES, filterDataByPermissions } from '../../../lib/auth/rbac';
import { COLLECTIONS, getTimestamp } from '../../../lib/firebase-admin';

// GET /api/students - View students (Teachers/Admins see all, Students see only themselves)
const getStudents = withAuth(async (req, res, { user, db }) => {
  const filters = {
    status: req.query.status as string,
    level: req.query.level as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
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
      students = students.filter(student => student.id === user.id);
    }

    return res.status(200).json({
      success: true,
      data: students || [],
      message: 'Students retrieved successfully',
      user_role: user.role,
      user_id: user.id
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
      message: 'Student created successfully',
      created_by: user.email
    });

  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create student'
    });
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
          message: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('Students API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
