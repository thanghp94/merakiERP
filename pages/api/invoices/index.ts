import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getInvoices(req, res);
      case 'POST':
        return await createInvoice(req, res);
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

async function getInvoices(req: NextApiRequest, res: NextApiResponse) {
  const { 
    is_income,
    status,
    student_id,
    employee_id,
    limit = 50,
    offset = 0
  } = req.query;

  let query = supabase
    .from('invoices')
    .select(`
      *,
      students:student_id(id, full_name),
      employees:employee_id(id, full_name),
      facilities:facility_id(id, name),
      classes:class_id(id, class_name),
      invoice_items(*)
    `)
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

  // Apply filters
  if (is_income !== undefined) {
    query = query.eq('is_income', is_income === 'true');
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (student_id) {
    query = query.eq('student_id', student_id);
  }

  if (employee_id) {
    query = query.eq('employee_id', employee_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch invoices' 
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: data || [] 
  });
}

async function createInvoice(req: NextApiRequest, res: NextApiResponse) {
  const {
    student_id,
    employee_id,
    facility_id,
    class_id,
    is_income,
    description,
    notes,
    due_date,
    tax_rate = 0,
    discount_amount = 0,
    items = []
  } = req.body;

  // Validation
  if (!description) {
    return res.status(400).json({
      success: false,
      message: 'Description is required'
    });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one item is required'
    });
  }

  // Validate items
  for (const item of items) {
    if (!item.item_name || !item.category || !item.unit_price) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have name, category, and unit price'
      });
    }
  }

  try {
    // Start transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        student_id: student_id || null,
        employee_id: employee_id || null,
        facility_id: facility_id || null,
        class_id: class_id || null,
        is_income: is_income || false,
        description,
        notes,
        due_date,
        tax_rate,
        discount_amount,
        status: 'draft'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoice'
      });
    }

    // Add items
    const itemsToInsert = items.map((item: any) => ({
      invoice_id: invoice.id,
      item_name: item.item_name,
      item_description: item.item_description || '',
      category: item.category,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      total_amount: (item.quantity || 1) * item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Items creation error:', itemsError);
      // Rollback invoice
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoice items'
      });
    }

    // Fetch complete invoice with items
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        students:student_id(id, full_name),
        employees:employee_id(id, full_name),
        facilities:facility_id(id, name),
        classes:class_id(id, class_name),
        invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Invoice created but failed to fetch complete data'
      });
    }

    return res.status(201).json({
      success: true,
      data: completeInvoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error occurred'
    });
  }
}
