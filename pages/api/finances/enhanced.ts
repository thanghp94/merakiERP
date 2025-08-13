import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getFinances(req, res);
      case 'POST':
        return await createFinance(req, res);
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

async function getFinances(req: NextApiRequest, res: NextApiResponse) {
  const { 
    is_income,
    category, 
    status, 
    student_id,
    employee_id,
    facility_id,
    start_date,
    end_date,
    limit = 50, 
    offset = 0 
  } = req.query;

  let query = supabase
    .from('finances')
    .select(`
      *,
      students:student_id (
        id,
        full_name
      ),
      employees:employee_id (
        id,
        full_name
      ),
      facilities:facility_id (
        id,
        name
      ),
      finance_items (
        id,
        item_name,
        item_description,
        quantity,
        unit_price,
        total_amount
      )
    `)
    .order('transaction_date', { ascending: false });

  if (is_income !== undefined) {
    query = query.eq('is_income', is_income === 'true');
  }

  if (category) {
    query = query.eq('category', category);
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

  if (facility_id) {
    query = query.eq('facility_id', facility_id);
  }

  if (start_date) {
    query = query.gte('transaction_date', start_date);
  }

  if (end_date) {
    query = query.lte('transaction_date', end_date);
  }

  if (limit) {
    query = query.limit(parseInt(limit as string));
  }

  if (offset) {
    query = query.range(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching finances',
      error: error.message 
    });
  }

  return res.status(200).json({
    success: true,
    data: data || [],
    message: 'Finances fetched successfully'
  });
}

async function createFinance(req: NextApiRequest, res: NextApiResponse) {
  const { 
    transaction_type,
    category, 
    student_id,
    employee_id,
    facility_id,
    amount, 
    payment_method,
    reference_number,
    is_income,
    transaction_date, 
    due_date,
    description,
    notes,
    status = 'completed',
    items = []
  } = req.body;

  // Validation
  if (!category) {
    return res.status(400).json({ 
      success: false, 
      message: 'Category is required' 
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Amount must be greater than 0' 
    });
  }

  if (!description) {
    return res.status(400).json({ 
      success: false, 
      message: 'Description is required' 
    });
  }

  if (!payment_method) {
    return res.status(400).json({ 
      success: false, 
      message: 'Payment method is required' 
    });
  }

  try {
    // Start a transaction
    const { data: finance, error: financeError } = await supabase
      .from('finances')
      .insert({
        transaction_type: category, // Use category as transaction_type for backward compatibility
        category,
        student_id: student_id || null,
        employee_id: employee_id || null,
        facility_id: facility_id || null,
        amount: parseFloat(amount),
        payment_method,
        reference_number,
        is_income: is_income !== undefined ? is_income : (transaction_type === 'income'),
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        due_date: due_date || null,
        description,
        notes,
        status
      })
      .select()
      .single();

    if (financeError) {
      console.error('Error creating finance:', financeError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating finance transaction',
        error: financeError.message 
      });
    }

    // If there are items, insert them
    let financeItems = [];
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        finance_id: finance.id,
        item_name: item.item_name,
        item_description: item.item_description || '',
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        total_amount: parseFloat(item.total_amount) || 0
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('finance_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Error creating finance items:', itemsError);
        // Don't fail the whole transaction, just log the error
        console.warn('Finance created but items failed to insert');
      } else {
        financeItems = insertedItems || [];
      }
    }

    // Fetch the complete finance record with relations
    const { data: completeFinance, error: fetchError } = await supabase
      .from('finances')
      .select(`
        *,
        students:student_id (
          id,
          full_name
        ),
        employees:employee_id (
          id,
          full_name
        ),
        facilities:facility_id (
          id,
          name
        ),
        finance_items (
          id,
          item_name,
          item_description,
          quantity,
          unit_price,
          total_amount
        )
      `)
      .eq('id', finance.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete finance:', fetchError);
      // Return the basic finance record if fetch fails
      return res.status(201).json({
        success: true,
        data: { ...finance, finance_items: financeItems },
        message: 'Finance transaction created successfully'
      });
    }

    return res.status(201).json({
      success: true,
      data: completeFinance,
      message: 'Finance transaction created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unexpected error occurred' 
    });
  }
}
