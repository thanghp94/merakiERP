import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ 
        success: false, 
        message: `Phương thức ${req.method} không được hỗ trợ` 
      });
    }

    return await generateTaskInstances(req, res);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi máy chủ nội bộ' 
    });
  }
}

async function generateTaskInstances(req: NextApiRequest, res: NextApiResponse) {
  const { 
    days_ahead = 14,
    task_id = null,
    force_regenerate = false
  } = req.body;

  try {
    // Call the PostgreSQL function to generate task instances
    const { data, error } = await supabase.rpc('generate_task_instances');

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Không thể tạo các công việc tự động' 
      });
    }

    // Get statistics of generated instances
    const { data: stats, error: statsError } = await supabase
      .from('task_instances')
      .select('status, task:tasks!task_instances_task_id_fkey(task_type, meta_data)')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    let generatedStats = {
      total_generated: 0,
      by_status: { pending: 0, completed: 0, overdue: 0 },
      by_category: {} as Record<string, number>
    };

    if (!statsError && stats) {
      generatedStats.total_generated = stats.length;
      
      stats.forEach(instance => {
        // Count by status
        if (instance.status && instance.status in generatedStats.by_status) {
          generatedStats.by_status[instance.status as keyof typeof generatedStats.by_status]++;
        }
        
        // Count by category
        if (instance.task && 
            typeof instance.task === 'object' && 
            'meta_data' in instance.task &&
            instance.task.meta_data &&
            typeof instance.task.meta_data === 'object' &&
            'category' in instance.task.meta_data &&
            instance.task.meta_data.category) {
          const category = instance.task.meta_data.category as string;
          generatedStats.by_category[category] = (generatedStats.by_category[category] || 0) + 1;
        }
      });
    }

    // Also update overdue tasks
    const { error: updateError } = await supabase
      .from('task_instances')
      .update({ status: 'overdue' })
      .lt('due_date', new Date().toISOString())
      .eq('status', 'pending');

    if (updateError) {
      console.warn('Warning: Could not update overdue tasks:', updateError);
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Tạo công việc tự động thành công',
        stats: generatedStats,
        days_ahead: days_ahead
      },
      message: 'Tạo công việc tự động thành công'
    });

  } catch (error) {
    console.error('Error generating task instances:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo công việc tự động' 
    });
  }
}
