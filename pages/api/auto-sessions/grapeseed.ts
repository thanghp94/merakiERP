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
      startingLesson,
      sessionType,
      tsiFirst,
      repFirst,
      tsiTeacherId,
      repTeacherId,
      tsiAssistantId,
      repAssistantId,
      roomId,
      timezone
    } = req.body;

    // Validate required fields
    if (!class_id || !numberOfSessions || !start_date || !startingLesson || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!tsiFirst && !repFirst) {
      return res.status(400).json({
        success: false,
        message: 'Must select either TSI first or REP first'
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

    // Validate that this is a GrapeSEED class
    if (classData.data?.program_type !== 'GrapeSEED') {
      return res.status(400).json({
        success: false,
        message: 'This API is only for GrapeSEED classes'
      });
    }

    // Get unit number for timing calculations
    const getUnitNumber = (): number => {
      if (!classData.data?.unit) return 1;
      const unitMatch = classData.data.unit.match(/U?(\d+)/);
      return unitMatch ? parseInt(unitMatch[1]) : 1;
    };

    // Calculate session durations based on unit
    const getSessionDurations = () => {
      const unitNumber = getUnitNumber();
      const isHighLevel = unitNumber >= 21;
      
      return {
        tsi: isHighLevel ? 50 : 40, // minutes
        rep: isHighLevel ? 40 : 30  // minutes
      };
    };

    const durations = getSessionDurations();
    const scheduleEntries = classData.data?.schedule_entries || [];

    if (scheduleEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class does not have schedule entries configured'
      });
    }

    // Generate sessions based on class schedule and form data
    const generateGrapeSeedSessions = () => {
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

      let currentLessonNum = parseInt(startingLesson.replace('L', ''));
      let weekOffset = 0;
      let sessionCount = 0;

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
          const currentUnit = classData.data?.unit || 'U1';
          const lessonId = `${currentUnit}.L${currentLessonNum}`;

          // Create main session name
          const mainSessionName = `${classData.class_name}.${currentUnit}.L${currentLessonNum}`;

          // Create two sessions for GrapeSEED
          const startTime = scheduleEntry.startTime;
          const [startHour, startMinute] = startTime.split(':').map(Number);
          
          let firstSessionType, secondSessionType;
          let firstTeacher, secondTeacher, firstAssistant, secondAssistant;
          let firstDuration, secondDuration;
          
          if (tsiFirst) {
            firstSessionType = 'TSI';
            secondSessionType = 'REP';
            firstTeacher = tsiTeacherId;
            secondTeacher = repTeacherId;
            firstAssistant = tsiAssistantId;
            secondAssistant = repAssistantId;
            firstDuration = durations.tsi;
            secondDuration = durations.rep;
          } else {
            firstSessionType = 'REP';
            secondSessionType = 'TSI';
            firstTeacher = repTeacherId;
            secondTeacher = tsiTeacherId;
            firstAssistant = repAssistantId;
            secondAssistant = tsiAssistantId;
            firstDuration = durations.rep;
            secondDuration = durations.tsi;
          }

          // First session
          const firstEndTime = new Date();
          firstEndTime.setHours(startHour, startMinute + firstDuration);
          
          const firstSession = {
            main_session_name: mainSessionName,
            session_date: sessionDateStr,
            subject_type: firstSessionType,
            teacher_id: firstTeacher,
            teaching_assistant_id: firstAssistant,
            location_id: roomId,
            start_time: startTime,
            end_time: `${firstEndTime.getHours().toString().padStart(2, '0')}:${firstEndTime.getMinutes().toString().padStart(2, '0')}`,
            duration_minutes: firstDuration,
            lesson_id: lessonId
          };

          // Second session (5 minutes break)
          const secondStartTime = new Date();
          secondStartTime.setHours(startHour, startMinute + firstDuration + 5);
          
          const secondEndTime = new Date();
          secondEndTime.setHours(startHour, startMinute + firstDuration + 5 + secondDuration);
          
          const secondSession = {
            main_session_name: mainSessionName,
            session_date: sessionDateStr,
            subject_type: secondSessionType,
            teacher_id: secondTeacher,
            teaching_assistant_id: secondAssistant,
            location_id: roomId,
            start_time: `${secondStartTime.getHours().toString().padStart(2, '0')}:${secondStartTime.getMinutes().toString().padStart(2, '0')}`,
            end_time: `${secondEndTime.getHours().toString().padStart(2, '0')}:${secondEndTime.getMinutes().toString().padStart(2, '0')}`,
            duration_minutes: secondDuration,
            lesson_id: lessonId
          };

          sessions.push({ firstSession, secondSession, mainSessionName, sessionDate: sessionDateStr, lessonId });

          currentLessonNum++;
          sessionCount++;
        }
        weekOffset++;
      }

      return sessions;
    };

    const generatedSessions = generateGrapeSeedSessions();

    // Check for teacher schedule conflicts before creating sessions
    for (const sessionGroup of generatedSessions) {
      const { firstSession, secondSession } = sessionGroup;
      
      // Check conflicts for first session
      if (firstSession.teacher_id) {
        const startTimeUTC = convertToUTC({
          timezone,
          date: firstSession.session_date,
          time: firstSession.start_time
        });
        const endTimeUTC = convertToUTC({
          timezone,
          date: firstSession.session_date,
          time: firstSession.end_time
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
          .eq('teacher_id', firstSession.teacher_id)
          .eq('date', firstSession.session_date)
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
            message: `Xung đột lịch dạy: ${teacherName} đã có lịch dạy vào ${firstSession.start_time} - ${firstSession.end_time} ngày ${firstSession.session_date}. Vui lòng chọn thời gian khác.`
          });
        }
      }

      // Check conflicts for second session
      if (secondSession.teacher_id) {
        const startTimeUTC = convertToUTC({
          timezone,
          date: secondSession.session_date,
          time: secondSession.start_time
        });
        const endTimeUTC = convertToUTC({
          timezone,
          date: secondSession.session_date,
          time: secondSession.end_time
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
          .eq('teacher_id', secondSession.teacher_id)
          .eq('date', secondSession.session_date)
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
            message: `Xung đột lịch dạy: ${teacherName} đã có lịch dạy vào ${secondSession.start_time} - ${secondSession.end_time} ngày ${secondSession.session_date}. Vui lòng chọn thời gian khác.`
          });
        }
      }
    }

    // Create main sessions and individual sessions
    const createdMainSessions = [];
    const createdSessions = [];

    for (const sessionGroup of generatedSessions) {
      const { firstSession, secondSession, mainSessionName, sessionDate, lessonId } = sessionGroup;

      // Create main session
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name: mainSessionName,
          scheduled_date: sessionDate,
          class_id: class_id,
          lesson_id: lessonId,
          data: {
            start_time: firstSession.start_time,
            end_time: secondSession.end_time,
            total_duration_minutes: firstSession.duration_minutes + secondSession.duration_minutes + 5, // Include 5 min break
            program_type: 'GrapeSEED',
            session_type: tsiFirst ? 'TSI_first' : 'REP_first',
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

      // Create individual sessions
      const sessionsToInsert = [
        {
          main_session_id: mainSessionData.main_session_id,
          subject_type: firstSession.subject_type,
          teacher_id: firstSession.teacher_id || null,
          teaching_assistant_id: firstSession.teaching_assistant_id || null,
          location_id: firstSession.location_id,
          start_time: convertToUTC({
            timezone,
            date: firstSession.session_date,
            time: firstSession.start_time
          }),
          end_time: convertToUTC({
            timezone,
            date: firstSession.session_date,
            time: firstSession.end_time
          }),
          date: firstSession.session_date,
          data: {
            lesson_id: firstSession.lesson_id,
            subject_name: `${mainSessionName} - ${firstSession.subject_type}`,
            duration_minutes: firstSession.duration_minutes,
            created_by_auto_session: true
          }
        },
        {
          main_session_id: mainSessionData.main_session_id,
          subject_type: secondSession.subject_type,
          teacher_id: secondSession.teacher_id || null,
          teaching_assistant_id: secondSession.teaching_assistant_id || null,
          location_id: secondSession.location_id,
          start_time: convertToUTC({
            timezone,
            date: secondSession.session_date,
            time: secondSession.start_time
          }),
          end_time: convertToUTC({
            timezone,
            date: secondSession.session_date,
            time: secondSession.end_time
          }),
          date: secondSession.session_date,
          data: {
            lesson_id: secondSession.lesson_id,
            subject_name: `${mainSessionName} - ${secondSession.subject_type}`,
            duration_minutes: secondSession.duration_minutes,
            created_by_auto_session: true
          }
        }
      ];

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert)
        .select();

      if (sessionsError) {
        console.error('Error creating sessions:', sessionsError);
        return res.status(500).json({
          success: false,
          message: 'Error creating sessions',
          error: sessionsError.message
        });
      }

      createdSessions.push(...sessionsData);
    }

    console.log(`✅ Created ${createdMainSessions.length} GrapeSEED main sessions with ${createdSessions.length} individual sessions`);

    return res.status(201).json({
      success: true,
      data: {
        mainSessions: createdMainSessions,
        sessions: createdSessions
      },
      message: `Tạo thành công ${createdMainSessions.length} buổi học GrapeSEED với ${createdSessions.length} session`
    });

  } catch (error) {
    console.error('Unexpected error in GrapeSEED auto-sessions:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi không mong muốn',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
