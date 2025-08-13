import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }

  try {
    const { payroll_record_id } = req.body;

    if (!payroll_record_id) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record ID is required'
      });
    }

    // Call the database function to create payroll invoice
    const { data, error } = await supabase
      .rpc('create_payroll_invoice', {
        p_payroll_record_id: payroll_record_id
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invoice'
      });
    }

    // Fetch the created invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        employees:employee_id(id, full_name, employee_code),
        invoice_items(*)
      `)
      .eq('id', data)
      .single();

    if (invoiceError) {
      console.error('Invoice fetch error:', invoiceError);
      return res.status(500).json({
        success: false,
        message: 'Invoice created but failed to fetch details'
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        invoice_id: data,
        invoice: invoice
      },
      message: 'Payroll invoice generated successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
