import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAttendance(req, res);
      case 'POST':
        if (req.body.bulk_create) {
          return await createBulkAttendance(req, res);
        }
        return await createAttendance(req, res);
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

async function getAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { main_session_id, enrollment_id, student_id, status, date, limit = 50, offset = 0 } = req.query;

  // First get attendance records
  let attendanceQuery = supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false });

  if (main_session_id) {
    attendanceQuery = attendanceQuery.eq('main_session_id', main_session_id);
  }

  if (enrollment_id) {
    attendanceQuery = attendanceQuery.eq('enrollment_id', enrollment_id);
  }

  if (status) {
    attendanceQuery = attendanceQuery.eq('status', status);
  }

  if (limit) {
    attendanceQuery = attendanceQuery.limit(parseInt(limit as string));
  }

  if (offset) {
    attendanceQuery = attendanceQuery.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

  if (attendanceError) {
    console.error('Supabase error:', attendanceError);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể lấy danh sách điểm danh' 
    });
  }

  // Now enrich the data with related information
  const enrichedData = [];
  
  for (const record of attendanceRecords || []) {
    // Get enrollment data
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        id,
        students (
          id,
          full_name,
          email
        ),
        classes (
          id,
          class_name,
          data,
          facilities (
            id,
            name
          )
        )
      `)
      .eq('id', record.enrollment_id)
      .single();

    // Get main session data
    const { data: mainSession } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, scheduled_date, lesson_id, data')
      .eq('main_session_id', record.main_session_id)
      .single();

    enrichedData.push({
      ...record,
      enrollments: enrollment,
      main_sessions: mainSession
    });
  }

  const attendanceData = enrichedData;

  return res.status(200).json({
    success: true,
    data: attendanceData,
    message: 'Lấy danh sách điểm danh thành công'
  });
}

async function createAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { main_session_id, enrollment_id, status = 'present', data = {} } = req.body;

  if (!main_session_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học chính là bắt buộc' 
    });
  }

  if (!enrollment_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID đăng ký là bắt buộc' 
    });
  }

  // Check if attendance record already exists
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('main_session_id', main_session_id)
    .eq('enrollment_id', enrollment_id)
    .single();

  if (existingAttendance) {
    return res.status(409).json({ 
      success: false, 
      message: 'Điểm danh cho học sinh này trong buổi học đã tồn tại' 
    });
  }

  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert({
      main_session_id,
      enrollment_id,
      status,
      data
    })
    .select(`
      *,
      enrollments (
        id,
        students (
          id,
          full_name,
          email
        )
      )
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Không thể tạo điểm danh mới' 
    });
  }

  return res.status(201).json({
    success: true,
    data: attendance,
    message: 'Tạo điểm danh mới thành công'
  });
}

async function createBulkAttendance(req: NextApiRequest, res: NextApiResponse) {
  const { main_session_id, class_id } = req.body;

  if (!main_session_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID buổi học chính là bắt buộc' 
    });
  }

  if (!class_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID lớp học là bắt buộc' 
    });
  }

  try {
    // Get all active enrollments for this class
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        students (
          id,
          full_name,
          email
        )
      `)
      .eq('class_id', class_id)
      .eq('status', 'active');

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể lấy danh sách đăng ký' 
      });
    }

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy học sinh nào trong lớp này' 
      });
    }

    // Check for existing attendance records
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('enrollment_id')
      .eq('main_session_id', main_session_id);

    const existingEnrollmentIds = existingAttendance?.map(a => a.enrollment_id) || [];

    // Filter out enrollments that already have attendance records
    const newEnrollments = enrollments.filter(enrollment => 
      !existingEnrollmentIds.includes(enrollment.id)
    );

    if (newEnrollments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Tất cả học sinh đã có điểm danh cho buổi học này'
      });
    }

    // Create attendance records for all new enrollments
    const attendanceRecords = newEnrollments.map(enrollment => ({
      main_session_id,
      enrollment_id: enrollment.id,
      status: 'present', // Default to present
      data: {}
    }));

    const { data: createdAttendance, error: createError } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select(`
        *,
        enrollments (
          id,
          students (
            id,
            full_name,
            email
          )
        )
      `);

    if (createError) {
      console.error('Error creating bulk attendance:', createError);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tạo điểm danh hàng loạt' 
      });
    }

    return res.status(201).json({
      success: true,
      data: createdAttendance,
      message: `Đã tạo điểm danh cho ${createdAttendance?.length || 0} học sinh`
    });

  } catch (error) {
    console.error('Bulk attendance creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo điểm danh hàng loạt' 
    });
  }
}
