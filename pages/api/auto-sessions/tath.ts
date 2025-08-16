import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { convertToUTC, extractTimezone } from '../../../lib/utils/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const {
      class_id,
      numberOfSessions,
      start_date,
      teacher_id,
      teaching_assistant_id,
      room_id,
      weeklySchedule,
      timezone
    } = req.body;

    // Validate required fields
    if (!class_id || !numberOfSessions || !start_date || !room_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get class information
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        facilities (
          name
        )
      `)
      .eq('id', class_id)
      .single();

    if (classError || !classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Validate that this is a TATH class (not GrapeSEED)
    if (classData.data?.program_type === 'GrapeSEED') {
      return res.status(400).json({
        success: false,
        message: 'This API is for non-GrapeSEED classes. Use the GrapeSEED API for GrapeSEED classes.'
      });
    }

    const scheduleEntries = classData.data?.schedule_entries || [];

    if (scheduleEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class does not have schedule entries configured'
      });
    }

    // Generate sessions based on class schedule and form data
    const generateTathSessions = () => {
      const startDate = new Date(start_date);
      const sessions = [];
      
      // Sort schedule entries by day of week
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      
      const sortedEntries = [...scheduleEntries].sort((a, b) => {
        return dayMap[a.day.toLowerCase()] - dayMap[b.day.toLowerCase()];
      });

      let sessionCount = 0;
      let weekOffset = 0;

      // Calculate next lesson date based on class schedule
      const getNextLessonDate = (startDate: Date, targetDay: string, weekOffset: number = 0): Date => {
        const targetDayNum = dayMap[targetDay.toLowerCase()];
        const currentDay = startDate.getDay();
        
        let daysUntilTarget = (targetDayNum - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && weekOffset === 0) {
          daysUntilTarget = 0;
        }
        
        const resultDate = new Date(startDate);
        resultDate.setDate(resultDate.getDate() + daysUntilTarget + (weekOffset * 7));
        
        return resultDate;
      };

      while (sessionCount < numberOfSessions) {
        for (const scheduleEntry of sortedEntries) {
          if (sessionCount >= numberOfSessions) break;

          const sessionDate = getNextLessonDate(startDate, scheduleEntry.day, weekOffset);
          const sessionDateStr = sessionDate.toISOString().split('T')[0];

          // Find corresponding weekly schedule entry
          const weeklyEntry = weeklySchedule?.find((ws: any) => ws.day === scheduleEntry.day);
          
          // Determine subject type, teacher, and assistant
          const subjectType = weeklyEntry?.subjectType || 'General';
          const sessionTeacher = weeklyEntry?.teacher_id || teacher_id;
          const sessionAssistant = weeklyEntry?.teaching_assistant_id || teaching_assistant_id;

          // Create main session name
          const mainSessionName = `${classData.class_name} - ${subjectType} - ${sessionDateStr}`;

          const session = {
            main_session_name: mainSessionName,
            session_date: sessionDateStr,
            subject_type: subjectType,
            teacher_id: sessionTeacher,
            teaching_assistant_id: sessionAssistant,
            location_id: room_id,
            start_time: scheduleEntry.startTime,
            end_time: scheduleEntry.endTime,
            duration_minutes: calculateDuration(scheduleEntry.startTime, scheduleEntry.endTime)
          };

          sessions.push(session);
          sessionCount++;
        }
        weekOffset++;
      }

      return sessions;
    };

    // Helper function to calculate duration
    const calculateDuration = (startTime: string, endTime: string): number => {
      if (!startTime || !endTime) return 0;
      
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);
      
      if (end <= start) return 0;
      
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    };

    const generatedSessions = generateTathSessions();

    // Check for teacher schedule conflicts before creating sessions
    for (const session of generatedSessions) {
      if (session.teacher_id) {
        const startTimeUTC = convertToUTC({
          timezone,
          date: session.session_date,
          time: session.start_time
        });
        const endTimeUTC = convertToUTC({
          timezone,
          date: session.session_date,
          time: session.end_time
        });
        
        const { data: conflictingSessions, error: conflictError } = await supabase
          .from('sessions')
          .select(`
            id,
            start_time,
            end_time,
            teacher_id,
            employees!sessions_teacher_id_fkey (
              full_name
            )
          `)
          .eq('teacher_id', session.teacher_id)
          .eq('date', session.session_date)
          .lt('start_time', endTimeUTC)
          .gt('end_time', startTimeUTC);
        
        if (conflictError) {
          return res.status(500).json({
            success: false,
            message: 'Error checking for conflicts',
            error: conflictError.message
          });
        }
        
        if (conflictingSessions && conflictingSessions.length > 0) {
          const conflictingSession = conflictingSessions[0] as any;
          const teacherName = conflictingSession.employees?.full_name || 'Giáo viên';
          
          return res.status(409).json({
            success: false,
            message: `Xung đột lịch dạy: ${teacherName} đã có lịch dạy vào ${session.start_time} - ${session.end_time} ngày ${session.session_date}. Vui lòng chọn thời gian khác.`
          });
        }
      }
    }

    // Create main sessions and individual sessions
    const createdMainSessions = [];
    const createdSessions = [];

    for (const session of generatedSessions) {
      // Create main session
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name: session.main_session_name,
          scheduled_date: session.session_date,
          class_id: class_id,
          lesson_id: `TATH_${session.session_date}_${session.subject_type}`,
          data: {
            start_time: session.start_time,
            end_time: session.end_time,
            total_duration_minutes: session.duration_minutes,
            program_type: classData.data?.program_type || 'Tiếng Anh Tiểu Học',
            subject_type: session.subject_type,
            created_by_auto_session: true
          }
        })
        .select()
        .single();

      if (mainSessionError) {
        console.error('Error creating main session:', mainSessionError);
        return res.status(500).json({
          success: false,
          message: 'Error creating main session',
          error: mainSessionError.message
        });
      }

      createdMainSessions.push(mainSessionData);

      // Create individual session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          main_session_id: mainSessionData.main_session_id,
          subject_type: session.subject_type,
          teacher_id: session.teacher_id || null,
          teaching_assistant_id: session.teaching_assistant_id || null,
          location_id: session.location_id,
          start_time: convertToUTC({
            timezone,
            date: session.session_date,
            time: session.start_time
          }),
          end_time: convertToUTC({
            timezone,
            date: session.session_date,
            time: session.end_time
          }),
          date: session.session_date,
          data: {
            lesson_id: `TATH_${session.session_date}_${session.subject_type}`,
            subject_name: session.main_session_name,
            duration_minutes: session.duration_minutes,
            created_by_auto_session: true
          }
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return res.status(500).json({
          success: false,
          message: 'Error creating session',
          error: sessionError.message
        });
      }

      createdSessions.push(sessionData);
    }

    console.log(`✅ Created ${createdMainSessions.length} TATH main sessions with ${createdSessions.length} individual sessions`);

    return res.status(201).json({
      success: true,
      data: {
        mainSessions: createdMainSessions,
        sessions: createdSessions
      },
      message: `Tạo thành công ${createdMainSessions.length} buổi học TATH với ${createdSessions.length} session`
    });

  } catch (error) {
    console.error('Unexpected error in TATH auto-sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi không mong muốn',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
