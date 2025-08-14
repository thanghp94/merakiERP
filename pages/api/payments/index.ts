import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Get all payments from invoice_payments table with invoice details
    const { data: payments, error } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        invoices!inner(
          id,
          invoice_number,
          students:student_id(id, full_name),
          employees:employee_id(id, full_name)
        )
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments' 
      });
    }

    // Transform the data to match the expected format
    const transformedPayments = (payments || []).map(payment => ({
      id: payment.id,
      invoice_id: payment.invoice_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number,
      notes: payment.notes,
      invoice: {
        invoice_number: payment.invoices.invoice_number,
        student: payment.invoices.students,
        employee: payment.invoices.employees
      }
    }));

    return res.status(200).json({ 
      success: true, 
      data: transformedPayments 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
