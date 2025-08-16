import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { convertToUTC, extractTimezone } from '../../../../lib/utils/timezone';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Phương thức không được hỗ trợ'
    });
  }

  try {
    const { id: classId } = req.query;
    const { 
      numberOfSessions, 
      tsiFirst, 
      tsiTeacherId, 
      repTeacherId, 
      tsiAssistantId, 
      repAssistantId, 
      roomId,
      startingLesson 
    } = req.body;

    // Validate required fields
    if (!classId || !numberOfSessions) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Get class information
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        facilities (
          id,
          name
        )
      `)
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      console.error('Error fetching class data:', classError);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Extract timezone
    const timezone = extractTimezone(req.body);

    const createdMainSessions = [];
    const createdSessions = [];
    const isGrapeseed = classData.data?.program_type === 'GrapeSEED';

    // Get class schedule entries
    const scheduleEntries = classData.data?.schedule_entries || [];
    if (scheduleEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lớp học chưa có lịch học được thiết lập'
      });
    }

    // Sort schedule entries by day of week for consistent ordering
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const sortedScheduleEntries = [...scheduleEntries].sort((a, b) => {
      return dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase());
    });

    // Calculate next lesson dates based on class schedule
    const getNextLessonDate = (startDate: Date, targetDay: string, weekOffset: number = 0): Date => {
      const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };
      
      const targetDayNum = dayMap[targetDay.toLowerCase()];
      const currentDay = startDate.getDay();
      
      let daysUntilTarget = (targetDayNum - currentDay + 7) % 7;
      if (daysUntilTarget === 0 && weekOffset === 0) {
        daysUntilTarget = 0; // Use today if it's the target day and first session
      }
      
      const resultDate = new Date(startDate);
      resultDate.setDate(resultDate.getDate() + daysUntilTarget + (weekOffset * 7));
      
      return resultDate;
    };

    // Start from today or a specified date
    const startDate = new Date();

    // Generate exactly numberOfSessions main sessions
    let currentDate = new Date(startDate);
    
    for (let sessionIndex = 0; sessionIndex < numberOfSessions; sessionIndex++) {
      // Cycle through schedule entries to follow the class schedule pattern
      const scheduleEntryIndex = sessionIndex % sortedScheduleEntries.length;
      const scheduleEntry = sortedScheduleEntries[scheduleEntryIndex];
      
      // Calculate the date for this session
      let sessionDate;
      if (sessionIndex === 0) {
        // For the first session, find the next occurrence of the first schedule day
        sessionDate = getNextLessonDate(currentDate, scheduleEntry.day, 0);
      } else {
        // For subsequent sessions, find the next occurrence of the current schedule day
        // Start from the day after the previous session
        const previousSessionDate = new Date(currentDate);
        previousSessionDate.setDate(previousSessionDate.getDate() + 1);
        sessionDate = getNextLessonDate(previousSessionDate, scheduleEntry.day, 0);
      }
      
      // Update currentDate for the next iteration
      currentDate = new Date(sessionDate);
      
      const sessionDateStr = sessionDate.toISOString().split('T')[0];

      // Generate main session name with lesson progression for Grapeseed
      let mainSessionName;
      let lessonId;
      
      if (isGrapeseed && startingLesson) {
        const startingLessonNum = parseInt(startingLesson.replace('L', ''));
        const currentLessonNum = startingLessonNum + sessionIndex;
        const currentUnit = classData.data?.unit || 'U1';
        lessonId = `${currentUnit}.L${currentLessonNum}`;
        mainSessionName = `${classData.class_name} - ${lessonId} (${sessionDateStr})`;
      } else {
        lessonId = `AUTO_${Date.now()}_${sessionIndex}`;
        mainSessionName = `${classData.class_name} - Buổi ${sessionIndex + 1} (${sessionDateStr})`;
      }

      // Create main session
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name: mainSessionName,
          scheduled_date: sessionDateStr,
          class_id: classId,
          lesson_id: lessonId,
          data: {
            created_by_auto: true,
            auto_session_index: sessionIndex + 1,
            total_auto_sessions: numberOfSessions,
            starting_lesson: startingLesson
          }
        })
        .select()
        .single();

      if (mainSessionError) {
        console.error('Error creating main session:', mainSessionError);
        return res.status(500).json({
          success: false,
          message: `Lỗi khi tạo buổi học chính ${sessionIndex + 1}: ${mainSessionError.message}`
        });
      }

      createdMainSessions.push(mainSessionData);

      // Create session templates based on class type
      const sessionTemplates = [];
      
      if (isGrapeseed) {
        // For Grapeseed, create TSI and REP sessions
        const currentUnit = classData.data?.unit || 'U1';
        const unitNumber = parseInt(currentUnit.replace('U', ''));
        
        // Determine durations based on unit
        const tsiDuration = unitNumber >= 21 ? 50 : 40;
        const repDuration = unitNumber >= 21 ? 40 : 30;
        
        // Calculate session times from schedule entry
        const [startHour, startMinute] = scheduleEntry.startTime.split(':').map(Number);
        
        if (tsiFirst) {
          // TSI first, then REP
          const tsiStartTime = scheduleEntry.startTime;
          const tsiEndTime = new Date();
          tsiEndTime.setHours(startHour, startMinute + tsiDuration);
          const tsiEndTimeStr = `${tsiEndTime.getHours().toString().padStart(2, '0')}:${tsiEndTime.getMinutes().toString().padStart(2, '0')}`;
          
          const repStartTime = new Date();
          repStartTime.setHours(startHour, startMinute + tsiDuration + 5); // 5 min break
          const repStartTimeStr = `${repStartTime.getHours().toString().padStart(2, '0')}:${repStartTime.getMinutes().toString().padStart(2, '0')}`;
          
          const repEndTime = new Date();
          repEndTime.setHours(startHour, startMinute + tsiDuration + 5 + repDuration);
          const repEndTimeStr = `${repEndTime.getHours().toString().padStart(2, '0')}:${repEndTime.getMinutes().toString().padStart(2, '0')}`;
          
          sessionTemplates.push(
            {
              subject_type: 'TSI',
              teacher_id: tsiTeacherId,
              teaching_assistant_id: tsiAssistantId,
              location_id: roomId,
              start_time: tsiStartTime,
              end_time: tsiEndTimeStr,
              duration_minutes: tsiDuration
            },
            {
              subject_type: 'REP',
              teacher_id: repTeacherId,
              teaching_assistant_id: repAssistantId,
              location_id: roomId,
              start_time: repStartTimeStr,
              end_time: repEndTimeStr,
              duration_minutes: repDuration
            }
          );
        } else {
          // REP first, then TSI
          const repStartTime = scheduleEntry.startTime;
          const repEndTime = new Date();
          repEndTime.setHours(startHour, startMinute + repDuration);
          const repEndTimeStr = `${repEndTime.getHours().toString().padStart(2, '0')}:${repEndTime.getMinutes().toString().padStart(2, '0')}`;
          
          const tsiStartTime = new Date();
          tsiStartTime.setHours(startHour, startMinute + repDuration + 5); // 5 min break
          const tsiStartTimeStr = `${tsiStartTime.getHours().toString().padStart(2, '0')}:${tsiStartTime.getMinutes().toString().padStart(2, '0')}`;
          
          const tsiEndTime = new Date();
          tsiEndTime.setHours(startHour, startMinute + repDuration + 5 + tsiDuration);
          const tsiEndTimeStr = `${tsiEndTime.getHours().toString().padStart(2, '0')}:${tsiEndTime.getMinutes().toString().padStart(2, '0')}`;
          
          sessionTemplates.push(
            {
              subject_type: 'REP',
              teacher_id: repTeacherId,
              teaching_assistant_id: repAssistantId,
              location_id: roomId,
              start_time: repStartTime,
              end_time: repEndTimeStr,
              duration_minutes: repDuration
            },
            {
              subject_type: 'TSI',
              teacher_id: tsiTeacherId,
              teaching_assistant_id: tsiAssistantId,
              location_id: roomId,
              start_time: tsiStartTimeStr,
              end_time: tsiEndTimeStr,
              duration_minutes: tsiDuration
            }
          );
        }
      } else {
        // For non-Grapeseed, create a single session
        sessionTemplates.push({
          subject_type: 'GENERAL',
          teacher_id: tsiTeacherId, // Use the first teacher provided
          teaching_assistant_id: tsiAssistantId,
          location_id: roomId,
          start_time: scheduleEntry.startTime,
          end_time: scheduleEntry.endTime,
          duration_minutes: 60 // Default duration
        });
      }

      // Create individual sessions for this main session
      for (const sessionTemplate of sessionTemplates) {
        // Check for teacher conflicts if teacher is specified
        if (sessionTemplate.teacher_id) {
          const startTimeUTC = convertToUTC({
            timezone,
            date: sessionDateStr,
            time: sessionTemplate.start_time
          });
          const endTimeUTC = convertToUTC({
            timezone,
            date: sessionDateStr,
            time: sessionTemplate.end_time
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
            .eq('teacher_id', sessionTemplate.teacher_id)
            .eq('date', sessionDateStr)
            .lt('start_time', endTimeUTC)
            .gt('end_time', startTimeUTC);

          if (conflictError) {
            console.error('Error checking for conflicts:', conflictError);
            return res.status(500).json({
              success: false,
              message: 'Lỗi khi kiểm tra xung đột lịch dạy'
            });
          }

          if (conflictingSessions && conflictingSessions.length > 0) {
            const conflictingSession = conflictingSessions[0] as any;
            const teacherName = conflictingSession.employees?.full_name || 'Giáo viên';
            
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

            // Clean up created main sessions
            for (const createdMainSession of createdMainSessions) {
              await supabase
                .from('main_sessions')
                .delete()
                .eq('main_session_id', createdMainSession.main_session_id);
            }

            return res.status(409).json({
              success: false,
              message: `Xung đột lịch dạy: ${teacherName} đã có lịch dạy vào ${conflictTimeRange} ngày ${sessionDateStr}. Vui lòng chọn thời gian khác.`
            });
          }
        }

        const startTimeUTC = convertToUTC({
          timezone,
          date: sessionDateStr,
          time: sessionTemplate.start_time
        });
        const endTimeUTC = convertToUTC({
          timezone,
          date: sessionDateStr,
          time: sessionTemplate.end_time
        });

        const { data: sessionResult, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            main_session_id: mainSessionData.main_session_id,
            subject_type: sessionTemplate.subject_type,
            teacher_id: sessionTemplate.teacher_id || null,
            teaching_assistant_id: sessionTemplate.teaching_assistant_id || null,
            location_id: sessionTemplate.location_id ? String(sessionTemplate.location_id) : null,
            start_time: startTimeUTC,
            end_time: endTimeUTC,
            date: sessionDateStr,
            data: {
              created_by_auto: true,
              duration_minutes: sessionTemplate.duration_minutes,
              auto_session_index: sessionIndex + 1,
              lesson_id: lessonId
            }
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          
          // Clean up created main sessions
          for (const createdMainSession of createdMainSessions) {
            await supabase
              .from('main_sessions')
              .delete()
              .eq('main_session_id', createdMainSession.main_session_id);
          }

          return res.status(500).json({
            success: false,
            message: `Lỗi khi tạo session: ${sessionError.message}`
          });
        }

        createdSessions.push(sessionResult);
      }
    }

    console.log(`✅ Created ${createdMainSessions.length} main sessions and ${createdSessions.length} individual sessions successfully`);

    return res.status(201).json({
      success: true,
      data: {
        mainSessionsCreated: createdMainSessions.length,
        totalIndividualSessions: createdSessions.length,
        mainSessions: createdMainSessions,
        sessions: createdSessions
      },
      message: `Đã tạo thành công ${createdMainSessions.length} buổi học tự động với ${createdSessions.length} session`
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
