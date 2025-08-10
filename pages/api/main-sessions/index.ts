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
        sessions
      } = req.body;

      // Validate required fields
      if (!main_session_name || !scheduled_date || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc'
        });
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

      // Prepare minimal data JSONB field - only store essential timing info
      const dataField = {
        start_time: calculatedStartTime,
        end_time: calculatedEndTime,
        total_duration_minutes: calculatedTotalDuration,
        created_by_form: true
      };

      // Insert main session with minimal data (removed total_duration_minutes column)
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name,
          scheduled_date,
          class_id,
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

      // Now create individual teaching sessions
      if (sessions && sessions.length > 0) {
        const teachingSessionsToInsert = sessions.map((session: any) => ({
          main_session_id: mainSessionData.id,
          subject_type: session.subject_type,
          teacher_id: session.teacher_id,
          teaching_assistant_id: session.teaching_assistant_id || null,
          location_id: session.location_id,
          start_time: session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes || 0,
          data: {
            created_by_form: true
          }
        }));

        const { error: sessionsError } = await supabase
          .from('teaching_sessions')
          .insert(teachingSessionsToInsert);

        if (sessionsError) {
          console.error('Error creating teaching sessions:', sessionsError);
          // Don't fail the main session creation, but log the error
          console.warn('Main session created but some teaching sessions failed to create');
        } else {
          console.log('✅ Created', sessions.length, 'teaching sessions successfully');
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
