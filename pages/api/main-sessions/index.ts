import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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

      // Validate required fields
      if (!main_session_name || !scheduled_date || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
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
        start_timestamp: calculatedStartTime ? `${scheduled_date}T${calculatedStartTime}:00+00:00` : null,
        end_timestamp: calculatedEndTime ? `${scheduled_date}T${calculatedEndTime}:00+00:00` : null,
        created_by_form: true
      };

      // Insert main session with lesson_id included (all timing data stored in JSONB data field)
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name,
          scheduled_date,
          class_id,
          lesson_id: extractedLessonId, // Save the lesson number to lesson_id field
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

      // Now create individual sessions
      if (sessions && sessions.length > 0) {
        const sessionsToInsert = sessions.map((session: any) => ({
          main_session_id: mainSessionData.main_session_id, // Link to main session (UUID)
          subject_type: session.subject_type,
          teacher_id: session.teacher_id || null, // Handle null teachers
          teaching_assistant_id: session.teaching_assistant_id || null,
          location_id: session.location_id ? String(session.location_id) : null, // Convert to text
          start_time: `${scheduled_date}T${session.start_time}:00+00:00`, // Combine date and time
          end_time: `${scheduled_date}T${session.end_time}:00+00:00`, // Combine date and time
          date: scheduled_date,
          data: {
            lesson_id: session.lesson_id || `${session.subject_type}${Date.now()}`,
            subject_name: `${main_session_name} - ${session.subject_type}`,
            subject_type: session.subject_type,
            main_session_id: mainSessionData.main_session_id,
            created_by_form: true
          }
        }));

        const { error: sessionsError } = await supabase
          .from('sessions')
          .insert(sessionsToInsert);

        if (sessionsError) {
          console.error('Error creating sessions:', sessionsError);
          // Don't fail the main session creation, but log the error
          console.warn('Main session created but some sessions failed to create');
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
