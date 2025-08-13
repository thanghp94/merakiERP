import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getPayrollPeriods(req, res);
      case 'POST':
        return await createPayrollPeriod(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ 
          success: false, 
          message: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}

async function getPayrollPeriods(req: NextApiRequest, res: NextApiResponse) {
  const { status, year } = req.query;

  let query = supabase
    .from('payroll_periods')
    .select('*')
    .order('start_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (year) {
    query = query.gte('start_date', `${year}-01-01`)
             .lte('end_date', `${year}-12-31`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payroll periods' 
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: data || [] 
  });
}

async function createPayrollPeriod(req: NextApiRequest, res: NextApiResponse) {
  const { period_name, start_date, end_date } = req.body;

  if (!period_name || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'Period name, start date, and end date are required'
    });
  }

  const { data, error } = await supabase
    .from('payroll_periods')
    .insert({
      period_name,
      start_date,
      end_date,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payroll period'
    });
  }

  return res.status(201).json({
    success: true,
    data,
    message: 'Payroll period created successfully'
  });
}
