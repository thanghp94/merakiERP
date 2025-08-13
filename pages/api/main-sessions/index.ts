import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { convertToUTC, extractTimezone, convertFromUTC } from '../../../lib/utils/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('main_sessions')
        .select(`
          *,
          classes (
            id,
            class_name,
            facilities (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching main sessions:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy danh sách buổi học chính',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
        message: 'Lấy danh sách buổi học chính thành công'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không mong muốn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        main_session_name,
        scheduled_date,
        start_time,
        end_time,
        total_duration_minutes,
        class_id,
        sessions,
        lesson_number // Add lesson_number from form
      } = req.body;

      // Extract timezone using utility function
      const timezone = extractTimezone(req.body);

      // Validate required fields
      if (!main_session_name || !scheduled_date || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
      }

      // Get class information to extract current unit
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('current_unit, data')
        .eq('id', class_id)
        .single();

      if (classError) {
        console.error('Error fetching class data:', classError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy thông tin lớp học',
          error: classError.message
        });
      }

      // Extract lesson number from main_session_name if not provided directly
      let extractedLessonId = lesson_number;
      if (!extractedLessonId && main_session_name) {
        // Try to extract lesson number from name like "GS12 test.U8.L3"
        const lessonMatch = main_session_name.match(/\.L(\d+)/);
        if (lessonMatch) {
          extractedLessonId = `L${lessonMatch[1]}`;
        }
      }

      // Combine current unit with lesson number to create full lesson ID
      let fullLessonId = extractedLessonId;
      if (extractedLessonId && classData) {
        // Get current unit from either the dedicated column or JSONB data
        const currentUnit = classData.current_unit || classData.data?.unit;
        if (currentUnit) {
          // Create full format like "U10.L1"
          fullLessonId = `${currentUnit}.${extractedLessonId}`;
        }
      }

      // Calculate start and end times from sessions if not provided
      let calculatedStartTime = start_time;
      let calculatedEndTime = end_time;
      let calculatedTotalDuration = total_duration_minutes || 0;
      
      if (sessions && sessions.length > 0) {
        const validSessions = sessions.filter((s: any) => s.start_time && s.end_time);
        if (validSessions.length > 0) {
          const sortedSessions = [...validSessions].sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
          calculatedStartTime = sortedSessions[0].start_time;
          calculatedEndTime = sortedSessions[sortedSessions.length - 1].end_time;
          
          // Calculate total duration from sessions
          calculatedTotalDuration = sessions.reduce((sum: number, session: any) => sum + (session.duration_minutes || 0), 0);
        }
      }

      // Prepare comprehensive data JSONB field with all timing information
      const dataField = {
        start_time: calculatedStartTime,
        end_time: calculatedEndTime,
        total_duration_minutes: calculatedTotalDuration,
        // Store full timestamp versions for compatibility
        start_timestamp: calculatedStartTime ? `${scheduled_date}T${calculatedStartTime}:00` : null,
        end_timestamp: calculatedEndTime ? `${scheduled_date}T${calculatedEndTime}:00` : null,
        created_by_form: true
      };

      // Insert main session with lesson_id included (all timing data stored in JSONB data field)
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name,
          scheduled_date,
          class_id,
          lesson_id: fullLessonId, // Save the full lesson ID (e.g., "U10.L1") to lesson_id field
          data: dataField
        })
        .select()
        .single();

      if (mainSessionError) {
        console.error('Error creating main session:', mainSessionError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tạo buổi học chính',
          error: mainSessionError.message
        });
      }

      // Check for teacher schedule conflicts before creating sessions
      if (sessions && sessions.length > 0) {
        console.log('🔍 Checking for teacher schedule conflicts...');
        
        for (const session of sessions) {
          if (session.teacher_id) {
            // Convert input times to UTC for consistent comparison with existing sessions
            const startTimeUTC = convertToUTC({
              timezone,
              date: scheduled_date,
              time: session.start_time
            });
            const endTimeUTC = convertToUTC({
              timezone,
              date: scheduled_date,
              time: session.end_time
            });
            
            // Check for overlapping sessions for this teacher
            // Correct overlap logic: existing_start < new_end AND existing_end > new_start
            const { data: conflictingSessions, error: conflictError } = await supabase
              .from('sessions')
              .select(`
                id,
                start_time,
                end_time,
                teacher_id,
                data,
                employees!sessions_teacher_id_fkey (
                  full_name
                )
              `)
              .eq('teacher_id', session.teacher_id)
              .eq('date', scheduled_date)
              .lt('start_time', endTimeUTC)
              .gt('end_time', startTimeUTC);
            
            if (conflictError) {
              console.error('Error checking for conflicts:', conflictError);
              return res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra xung đột lịch dạy',
                error: conflictError.message
              });
            }
            
            if (conflictingSessions && conflictingSessions.length > 0) {
              const conflictingSession = conflictingSessions[0] as any;
              const teacherName = conflictingSession.employees?.full_name || 'Giáo viên';
              
              // Format the conflict time properly - extract just the time part
              const conflictStartTime = new Date(conflictingSession.start_time);
              const conflictEndTime = new Date(conflictingSession.end_time);
              
              const conflictTimeRange = `${conflictStartTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone
              })} - ${conflictEndTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone
              })}`;
              
              // Delete the main session since we can't create the sessions
              await supabase
                .from('main_sessions')
                .delete()
                .eq('main_session_id', mainSessionData.main_session_id);
              
              return res.status(409).json({
                success: false,
                message: `Xung đột lịch dạy: ${teacherName} đã có lịch dạy vào ${conflictTimeRange} ngày ${scheduled_date}. Vui lòng chọn thời gian khác.`,
                conflict_details: {
                  teacher_name: teacherName,
                  conflict_time: conflictTimeRange,
                  conflict_date: scheduled_date,
                  session_type: session.subject_type,
                  requested_time: `${session.start_time} - ${session.end_time}`
                }
              });
            }
          }
        }
        
        // No conflicts found, proceed to create sessions
        const sessionsToInsert = sessions.map((session: any) => {
          // Convert user timezone to UTC for consistent storage
          const startTimeUTC = convertToUTC({
            timezone,
            date: scheduled_date,
            time: session.start_time
          });
          const endTimeUTC = convertToUTC({
            timezone,
            date: scheduled_date,
            time: session.end_time
          });
          
          return {
            main_session_id: mainSessionData.main_session_id, // Link to main session (UUID)
            subject_type: session.subject_type,
            teacher_id: session.teacher_id || null, // Handle null teachers
            teaching_assistant_id: session.teaching_assistant_id || null,
            location_id: session.location_id ? String(session.location_id) : null, // Convert to text
            start_time: startTimeUTC, // Store in UTC
            end_time: endTimeUTC, // Store in UTC
            date: scheduled_date,
            data: {
              lesson_id: session.lesson_id || `${session.subject_type}${Date.now()}`,
              subject_name: `${main_session_name} - ${session.subject_type}`,
              subject_type: session.subject_type,
              main_session_id: mainSessionData.main_session_id,
              created_by_form: true
            }
          };
        });

        const { error: sessionsError } = await supabase
          .from('sessions')
          .insert(sessionsToInsert);

        if (sessionsError) {
          console.error('Error creating sessions:', sessionsError);
          
          // Delete the main session since sessions failed to create
          await supabase
            .from('main_sessions')
            .delete()
            .eq('main_session_id', mainSessionData.main_session_id);
          
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo các buổi học con',
            error: sessionsError.message
          });
        } else {
          console.log('✅ Created', sessions.length, 'sessions successfully');
        }
      }

      console.log('✅ Main session created successfully with minimal data storage');

      return res.status(201).json({
        success: true,
        data: mainSessionData,
        message: 'Tạo buổi học thành công'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi không mong muốn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Phương thức không được hỗ trợ'
  });
}
