import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

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
    limit = 50, 
    offset = 0 
  } = req.query;

  // If filtering by facility, class, or program_type, we need to join with enrollments and classes
  const needsJoin = facility_id || class_id || program_type;

  let query;

  if (needsJoin) {
    // Query with joins to get students filtered by facility/class/program
    query = supabase
      .from('students')
      .select(`
        *,
        enrollments!inner (
          id,
          class_id,
          status,
          classes!inner (
            id,
            class_name,
            facility_id,
            data,
            facilities (
              id,
              name
            )
          )
        )
      `)
      .eq('enrollments.status', 'active')
      .order('created_at', { ascending: false });

    // Apply facility filter
    if (facility_id && facility_id !== 'all') {
      query = query.eq('enrollments.classes.facility_id', facility_id);
    }

    // Apply class filter
    if (class_id && class_id !== 'all') {
      query = query.eq('enrollments.class_id', class_id);
    }

    // Apply program_type filter
    if (program_type && program_type !== 'all') {
      query = query.eq('enrollments.classes.data->>program_type', program_type);
    }
  } else {
    // Simple query without joins
    query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
  }

  // Apply common filters
  if (status) {
    query = query.eq('status', status);
  }

  if (level && level !== 'all') {
    query = query.eq('data->>level', level);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (limit) {
    query = query.limit(parseInt(limit as string));
  }

  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách học sinh' 
    });
  }

  // If we used joins, we need to flatten the data and remove duplicates
  let processedData = data;
  if (needsJoin && data) {
    // Remove duplicate students (a student might be in multiple classes)
    const uniqueStudents = new Map();
    
    data.forEach((student: any) => {
      if (!uniqueStudents.has(student.id)) {
        // Add enrollment and class info to student data
        const studentWithEnrollment = {
          ...student,
          current_enrollments: student.enrollments || []
        };
        delete studentWithEnrollment.enrollments;
        uniqueStudents.set(student.id, studentWithEnrollment);
      }
    });
    
    processedData = Array.from(uniqueStudents.values());
  }

  return res.status(200).json({
    success: true,
    data: processedData,
    message: 'Lấy danh sách học sinh thành công'
  });
}

async function createStudent(req: NextApiRequest, res: NextApiResponse) {
  const { full_name, email, phone, status = 'active', data = {} } = req.body;

  if (!full_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Tên học sinh là bắt buộc' 
    });
  }

  const { data: student, error } = await supabase
    .from('students')
    .insert({
      full_name,
      email,
      phone,
      status,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo học sinh mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: student,
    message: 'Tạo học sinh mới thành công'
  });
}
