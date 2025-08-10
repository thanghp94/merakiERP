import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

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
          ),
          sessions!sessions_lesson_id_fkey (
            *,
            employees!sessions_teacher_id_fkey (
              id,
              full_name
            ),
            teaching_assistants:employees!sessions_teaching_assistant_id_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('main_session_id', id)
        .single();

      if (error) {
        console.error('Error fetching main session:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi lấy thông tin buổi học',
          error: error.message
        });
      }

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy buổi học'
        });
      }

      return res.status(200).json({
        success: true,
        data,
        message: 'Lấy thông tin buổi học thành công'
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

  if (req.method === 'PUT') {
    try {
      const {
        main_session_name,
        scheduled_date,
        start_time,
        end_time,
        total_duration_minutes,
        class_id,
        is_active
      } = req.body;

      // Create timestamp with time zone from date and time if provided
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (main_session_name !== undefined) updateData.main_session_name = main_session_name;
      if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
      if (total_duration_minutes !== undefined) updateData.total_duration_minutes = total_duration_minutes;
      if (class_id !== undefined) updateData.class_id = class_id;
      if (is_active !== undefined) updateData.is_active = is_active;

      if (start_time !== undefined && scheduled_date !== undefined) {
        updateData.start_time = new Date(`${scheduled_date}T${start_time}:00`).toISOString();
      }
      if (end_time !== undefined && scheduled_date !== undefined) {
        updateData.end_time = new Date(`${scheduled_date}T${end_time}:00`).toISOString();
      }

      const { data, error } = await supabase
        .from('main_sessions')
        .update(updateData)
        .eq('main_session_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating main session:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi cập nhật buổi học',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data,
        message: 'Cập nhật buổi học thành công'
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

  if (req.method === 'DELETE') {
    try {
      // First delete related sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('lesson_id', id);

      if (sessionsError) {
        console.error('Error deleting sessions:', sessionsError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi xóa các session',
          error: sessionsError.message
        });
      }

      // Then delete the main session
      const { error } = await supabase
        .from('main_sessions')
        .delete()
        .eq('main_session_id', id);

      if (error) {
        console.error('Error deleting main session:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi xóa buổi học',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Xóa buổi học thành công'
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
