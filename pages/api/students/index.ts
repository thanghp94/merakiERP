import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin, ROLES, filterDataByPermissions } from '../../../lib/auth/rbac';

// GET /api/students - View students (Teachers/Admins see all, Students see only themselves)
const getStudents = withAuth(async (req, res, { user, supabase }) => {
  const filters = {
    status: req.query.status as string,
    level: req.query.level as string,
    search: req.query.search as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
  };

  try {
    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.level && filters.level !== 'all') {
      query = query.eq('data->>level', filters.level);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // For students, they can only see their own data (handled by RLS)
    // For teachers/admins, they see all students (handled by RLS)
    const { data: students, error } = await query;

    if (error) {
      throw error;
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
const createStudent = withTeacherOrAdmin(async (req, res, { user, supabase }) => {
  const studentData = req.body;
  
  // Basic validation
  if (!studentData.full_name || !studentData.data?.parent?.name || !studentData.data?.parent?.phone) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: full_name, parent name, and parent phone are required'
    });
  }

  try {
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert([{
        ...studentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: newStudent,
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
