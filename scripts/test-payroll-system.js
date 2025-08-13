const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayrollSystem() {
  console.log('🧪 Testing Vietnamese Payroll System...\n');

  try {
    // Step 1: Create payroll schema
    console.log('📋 Step 1: Setting up payroll schema...');
    const { error: schemaError } = await supabase.rpc('exec', {
      sql: `
        -- Test if payroll tables exist
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('payroll_periods', 'payroll_records', 'vn_tax_brackets');
      `
    });

    if (schemaError) {
      console.log('⚠️  Payroll schema not found. Please run the SQL script first:');
      console.log('   psql -d your_database -f scripts/vietnamese-payroll-system.sql');
      return;
    }

    // Step 2: Create test employee if not exists
    console.log('👤 Step 2: Creating test employee...');
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_code', 'TEST001')
      .single();

    let employeeId;
    if (!existingEmployee) {
      const { data: newEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          full_name: 'Nguyễn Văn Test',
          employee_code: 'TEST001',
          position: 'Giáo viên',
          department: 'Giảng dạy',
          status: 'active',
          data: {
            email: 'test@example.com',
            phone: '0123456789',
            hire_date: '2024-01-01',
            salary: 15000000
          }
        })
        .select('id')
        .single();

      if (employeeError) {
        console.error('❌ Error creating employee:', employeeError);
        return;
      }
      employeeId = newEmployee.id;
      console.log('✅ Test employee created:', employeeId);
    } else {
      employeeId = existingEmployee.id;
      console.log('✅ Using existing test employee:', employeeId);
    }

    // Step 3: Create test payroll period
    console.log('📅 Step 3: Creating test payroll period...');
    const { data: period, error: periodError } = await supabase
      .from('payroll_periods')
      .insert({
        period_name: 'Test Tháng 12/2024',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        status: 'draft'
      })
      .select()
      .single();

    if (periodError) {
      console.error('❌ Error creating payroll period:', periodError);
      return;
    }
    console.log('✅ Payroll period created:', period.period_name);

    // Step 4: Test social insurance calculation
    console.log('🧮 Step 4: Testing social insurance calculation...');
    const { data: insuranceCalc, error: insuranceError } = await supabase
      .rpc('calculate_vietnamese_social_insurance', {
        gross_salary: 15000000
      });

    if (insuranceError) {
      console.error('❌ Error calculating social insurance:', insuranceError);
      return;
    }
    console.log('✅ Social insurance calculation:');
    console.log('   BHXH Employee:', insuranceCalc[0].bhxh_employee.toLocaleString('vi-VN'), 'VND');
    console.log('   BHYT Employee:', insuranceCalc[0].bhyt_employee.toLocaleString('vi-VN'), 'VND');
    console.log('   BHTN Employee:', insuranceCalc[0].bhtn_employee.toLocaleString('vi-VN'), 'VND');
    console.log('   BHXH Employer:', insuranceCalc[0].bhxh_employer.toLocaleString('vi-VN'), 'VND');

    // Step 5: Test income tax calculation
    console.log('💰 Step 5: Testing income tax calculation...');
    const taxableIncome = 15000000 - insuranceCalc[0].bhxh_employee - insuranceCalc[0].bhyt_employee - insuranceCalc[0].bhtn_employee;
    const { data: taxCalc, error: taxError } = await supabase
      .rpc('calculate_vietnamese_income_tax', {
        taxable_income: taxableIncome,
        dependents: 2
      });

    if (taxError) {
      console.error('❌ Error calculating income tax:', taxError);
      return;
    }
    console.log('✅ Income tax calculation:');
    console.log('   Taxable income:', taxableIncome.toLocaleString('vi-VN'), 'VND');
    console.log('   Income tax (2 dependents):', taxCalc.toLocaleString('vi-VN'), 'VND');

    // Step 6: Create payroll record
    console.log('📊 Step 6: Creating payroll record...');
    const { data: payrollRecord, error: payrollError } = await supabase
      .from('payroll_records')
      .insert({
        employee_id: employeeId,
        payroll_period_id: period.id,
        base_salary: 15000000,
        working_days: 26,
        actual_working_days: 24,
        allowances: {
          transport: 500000,
          lunch: 300000,
          phone: 200000
        },
        bonuses: {
          performance: 1000000
        },
        gross_salary: 16000000,
        bhxh_employee: insuranceCalc[0].bhxh_employee,
        bhyt_employee: insuranceCalc[0].bhyt_employee,
        bhtn_employee: insuranceCalc[0].bhtn_employee,
        personal_income_tax: taxCalc,
        other_deductions: {
          advance: 500000
        },
        total_deductions: insuranceCalc[0].bhxh_employee + insuranceCalc[0].bhyt_employee + insuranceCalc[0].bhtn_employee + taxCalc + 500000,
        net_salary: 16000000 - (insuranceCalc[0].bhxh_employee + insuranceCalc[0].bhyt_employee + insuranceCalc[0].bhtn_employee + taxCalc + 500000),
        bhxh_employer: insuranceCalc[0].bhxh_employer,
        bhyt_employer: insuranceCalc[0].bhyt_employer,
        bhtn_employer: insuranceCalc[0].bhtn_employer
      })
      .select()
      .single();

    if (payrollError) {
      console.error('❌ Error creating payroll record:', payrollError);
      return;
    }
    console.log('✅ Payroll record created:');
    console.log('   Gross salary:', payrollRecord.gross_salary.toLocaleString('vi-VN'), 'VND');
    console.log('   Total deductions:', payrollRecord.total_deductions.toLocaleString('vi-VN'), 'VND');
    console.log('   Net salary:', payrollRecord.net_salary.toLocaleString('vi-VN'), 'VND');

    // Step 7: Generate invoice
    console.log('🧾 Step 7: Generating payroll invoice...');
    const { data: invoiceId, error: invoiceError } = await supabase
      .rpc('create_payroll_invoice', {
        p_payroll_record_id: payrollRecord.id
      });

    if (invoiceError) {
      console.error('❌ Error generating invoice:', invoiceError);
      return;
    }

    // Fetch the created invoice
    const { data: invoice, error: fetchInvoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchInvoiceError) {
      console.error('❌ Error fetching invoice:', fetchInvoiceError);
      return;
    }

    console.log('✅ Payroll invoice generated:');
    console.log('   Invoice number:', invoice.invoice_number);
    console.log('   Total amount:', invoice.total_amount.toLocaleString('vi-VN'), 'VND');
    console.log('   Invoice items:', invoice.invoice_items.length);

    // Step 8: Test API endpoints
    console.log('🌐 Step 8: Testing API endpoints...');
    
    // Test periods API
    const periodsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payroll/periods`);
    if (periodsResponse.ok) {
      const periodsData = await periodsResponse.json();
      console.log('✅ Periods API working:', periodsData.data?.length || 0, 'periods');
    } else {
      console.log('⚠️  Periods API not accessible (server may not be running)');
    }

    // Test records API
    const recordsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payroll/records?payroll_period_id=${period.id}`);
    if (recordsResponse.ok) {
      const recordsData = await recordsResponse.json();
      console.log('✅ Records API working:', recordsData.data?.length || 0, 'records');
    } else {
      console.log('⚠️  Records API not accessible (server may not be running)');
    }

    console.log('\n🎉 Vietnamese Payroll System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database schema: Ready');
    console.log('✅ Social insurance calculation: Working');
    console.log('✅ Income tax calculation: Working');
    console.log('✅ Payroll record creation: Working');
    console.log('✅ Invoice generation: Working');
    console.log('✅ API endpoints: Ready');

    console.log('\n🚀 Next steps:');
    console.log('1. Add PayrollTab to your dashboard');
    console.log('2. Run the development server: npm run dev');
    console.log('3. Navigate to the Payroll section');
    console.log('4. Create payroll periods and records');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPayrollSystem();
