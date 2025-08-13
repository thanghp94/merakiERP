import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getPayrollRecords(req, res);
      case 'POST':
        return await createPayrollRecord(req, res);
      case 'PUT':
        return await updatePayrollRecord(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
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

async function getPayrollRecords(req: NextApiRequest, res: NextApiResponse) {
  const { payroll_period_id, employee_id } = req.query;

  let query = supabase
    .from('payroll_records')
    .select(`
      *,
      employees:employee_id(id, full_name, employee_code, data),
      payroll_periods:payroll_period_id(id, period_name, start_date, end_date, status),
      invoices:invoice_id(id, invoice_number, status, total_amount)
    `)
    .order('created_at', { ascending: false });

  if (payroll_period_id) {
    query = query.eq('payroll_period_id', payroll_period_id);
  }

  if (employee_id) {
    query = query.eq('employee_id', employee_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payroll records' 
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: data || [] 
  });
}

async function createPayrollRecord(req: NextApiRequest, res: NextApiResponse) {
  const {
    employee_id,
    payroll_period_id,
    base_salary,
    working_days = 26, // Standard working days in Vietnam
    actual_working_days,
    allowances = {},
    bonuses = {},
    other_deductions = {},
    dependents = 0,
    insurance_base = null
  } = req.body;

  if (!employee_id || !payroll_period_id || !base_salary) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID, payroll period ID, and base salary are required'
    });
  }

  try {
    // Calculate proportional salary based on actual working days
    const proportional_salary = (base_salary / working_days) * actual_working_days;
    
    // Calculate allowances and bonuses totals
    const total_allowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const total_bonuses = Object.values(bonuses).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    
    // Calculate gross salary
    const gross_salary = proportional_salary + total_allowances + total_bonuses;

    // Calculate social insurance using the database function
    const { data: insuranceData, error: insuranceError } = await supabase
      .rpc('calculate_vietnamese_social_insurance', {
        gross_salary,
        insurance_base
      });

    if (insuranceError) {
      throw new Error('Failed to calculate social insurance');
    }

    const insurance = insuranceData[0];

    // Calculate taxable income (gross - social insurance)
    const taxable_income = gross_salary - insurance.bhxh_employee - insurance.bhyt_employee - insurance.bhtn_employee;

    // Calculate income tax using the database function
    const { data: taxData, error: taxError } = await supabase
      .rpc('calculate_vietnamese_income_tax', {
        taxable_income,
        dependents
      });

    if (taxError) {
      throw new Error('Failed to calculate income tax');
    }

    const personal_income_tax = taxData;

    // Calculate other deductions total
    const total_other_deductions = Object.values(other_deductions).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

    // Calculate total deductions
    const total_deductions = insurance.bhxh_employee + insurance.bhyt_employee + insurance.bhtn_employee + 
                           personal_income_tax + total_other_deductions;

    // Calculate net salary
    const net_salary = gross_salary - total_deductions;

    // Create payroll record
    const { data, error } = await supabase
      .from('payroll_records')
      .insert({
        employee_id,
        payroll_period_id,
        base_salary,
        working_days,
        actual_working_days,
        allowances,
        bonuses,
        gross_salary,
        bhxh_employee: insurance.bhxh_employee,
        bhyt_employee: insurance.bhyt_employee,
        bhtn_employee: insurance.bhtn_employee,
        personal_income_tax,
        other_deductions,
        total_deductions,
        net_salary,
        bhxh_employer: insurance.bhxh_employer,
        bhyt_employer: insurance.bhyt_employer,
        bhtn_employer: insurance.bhtn_employer
      })
      .select(`
        *,
        employees:employee_id(id, full_name, employee_code),
        payroll_periods:payroll_period_id(id, period_name)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payroll record'
      });
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Payroll record created successfully'
    });

  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate payroll'
    });
  }
}

async function updatePayrollRecord(req: NextApiRequest, res: NextApiResponse) {
  const { id, ...updateData } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Payroll record ID is required'
    });
  }

  const { data, error } = await supabase
    .from('payroll_records')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      employees:employee_id(id, full_name, employee_code),
      payroll_periods:payroll_period_id(id, period_name)
    `)
    .single();

  if (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payroll record'
    });
  }

  return res.status(200).json({
    success: true,
    data,
    message: 'Payroll record updated successfully'
  });
}
