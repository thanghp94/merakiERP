import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select(`
          *,
          students:student_id (
            id,
            full_name
          ),
          classes:class_id (
            id,
            class_name
          )
        `)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching payment schedules:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching payment schedules',
          error: error.message 
        });
      }

      res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Error in payment schedules API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        student_id,
        class_id,
        total_amount,
        paid_amount = 0,
        due_date,
        data: scheduleData
      } = req.body;

      if (!student_id || !total_amount || !due_date) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: student_id, total_amount, due_date'
        });
      }

      const remaining_amount = total_amount - paid_amount;

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert([{
          student_id,
          class_id,
          total_amount,
          paid_amount,
          remaining_amount,
          due_date,
          data: scheduleData || {}
        }])
        .select(`
          *,
          students:student_id (
            id,
            full_name
          ),
          classes:class_id (
            id,
            class_name
          )
        `);

      if (error) {
        console.error('Error creating payment schedule:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating payment schedule',
          error: error.message 
        });
      }

      res.status(201).json({
        success: true,
        data: data?.[0] || null,
        message: 'Payment schedule created successfully'
      });
    } catch (error) {
      console.error('Error in payment schedules API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }
}
