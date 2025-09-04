import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Fetch students with pending invoices
    const { data: studentsWithInvoices, error } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        email,
        phone,
        facility:facilities(id, name),
        class:classes(id, class_name, program_type),
        invoices:invoices!student_id(
          id,
          invoice_number,
          invoice_date,
          due_date,
          total_amount,
          paid_amount,
          remaining_amount,
          status
        )
      `)
      .eq('invoices.is_income', true)
      .in('invoices.status', ['sent', 'partial', 'overdue'])
      .gt('invoices.remaining_amount', 0);

    if (error) {
      console.error('Error fetching students with pending invoices:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch students with pending invoices',
        error: error.message 
      });
    }

    // Process the data to calculate totals and overdue status
    const processedData = studentsWithInvoices
      .filter(student => student.invoices && student.invoices.length > 0)
      .map(student => {
        const pendingInvoices = student.invoices.map(invoice => {
          const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
          return {
            ...invoice,
            is_overdue: isOverdue
          };
        });

        const totalPendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.remaining_amount, 0);
        const hasOverdue = pendingInvoices.some(invoice => invoice.is_overdue);

        return {
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          facility: student.facility,
          class: student.class,
          pending_invoices: pendingInvoices,
          total_pending_amount: totalPendingAmount,
          has_overdue: hasOverdue
        };
      })
      .sort((a, b) => {
        // Sort by overdue first, then by total amount descending
        if (a.has_overdue && !b.has_overdue) return -1;
        if (!a.has_overdue && b.has_overdue) return 1;
        return b.total_pending_amount - a.total_pending_amount;
      });

    return res.status(200).json({
      success: true,
      data: processedData,
      summary: {
        total_students: processedData.length,
        total_receivable: processedData.reduce((sum, student) => sum + student.total_pending_amount, 0),
        overdue_students: processedData.filter(student => student.has_overdue).length,
        overdue_amount: processedData
          .filter(student => student.has_overdue)
          .reduce((sum, student) => sum + student.total_pending_amount, 0)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
