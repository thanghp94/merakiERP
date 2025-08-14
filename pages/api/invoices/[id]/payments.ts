import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invoice ID is required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getInvoicePayments(req, res, id);
      case 'POST':
        return await createPayment(req, res, id);
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

async function getInvoicePayments(req: NextApiRequest, res: NextApiResponse, invoiceId: string) {
  try {
    const { data: payments, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: payments || [] 
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
}

async function createPayment(req: NextApiRequest, res: NextApiResponse, invoiceId: string) {
  const {
    amount,
    payment_method,
    payment_date,
    reference_number,
    notes
  } = req.body;

  // Validation
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment amount is required'
    });
  }

  if (!payment_method) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required'
    });
  }

  if (!payment_date) {
    return res.status(400).json({
      success: false,
      message: 'Payment date is required'
    });
  }

  try {
    // First, get the invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if payment amount doesn't exceed remaining amount
    if (amount > invoice.remaining_amount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed remaining amount of ${invoice.remaining_amount}`
      });
    }

    // Create the payment record in invoice_payments table
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        amount: amount,
        payment_method: payment_method,
        payment_date: payment_date,
        reference_number: reference_number || null,
        notes: notes || null
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment record'
      });
    }

    // The invoice totals will be updated automatically by the database trigger

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment confirmed successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error occurred'
    });
  }
}
