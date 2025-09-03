const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayrollSystem() {
  console.log('🧪 Testing Payroll System...\n');

  try {
    // Step 1: Get an employee with employee_code
    console.log('1. Getting employee data...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, employee_code')
      .limit(1);

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      return;
    }

    if (!employees || employees.length === 0) {
      console.error('❌ No employees found');
      return;
    }

    const employee = employees[0];
    console.log(`✅ Found employee: ${employee.full_name} (${employee.employee_code})`);

    // Step 2: Get or create a payroll period
    console.log('\n2. Getting payroll period...');
    let { data: periods, error: periodError } = await supabase
      .from('payroll_periods')
      .select('id, period_name')
      .eq('status', 'draft')
      .limit(1);

    if (periodError) {
      console.error('❌ Error fetching payroll periods:', periodError);
      return;
    }

    let payrollPeriodId;
    if (!periods || periods.length === 0) {
      console.log('Creating new payroll period...');
      const { data: newPeriod, error: createError } = await supabase
        .from('payroll_periods')
        .insert({
          period_name: `Test Period ${new Date().toISOString().slice(0, 7)}`,
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'draft'
        })
        .select('id, period_name')
        .single();

      if (createError) {
        console.error('❌ Error creating payroll period:', createError);
        return;
      }

      payrollPeriodId = newPeriod.id;
      console.log(`✅ Created payroll period: ${newPeriod.period_name}`);
    } else {
      payrollPeriodId = periods[0].id;
      console.log(`✅ Using existing payroll period: ${periods[0].period_name}`);
    }

    // Step 3: Test payroll record creation
    console.log('\n3. Creating payroll record...');
    const payrollData = {
      employee_id: employee.id,
      payroll_period_id: payrollPeriodId,
      base_salary: 15000000, // 15 million VND
      working_days: 26,
      actual_working_days: 26,
      allowances: { transport: 500000, lunch: 300000 },
      bonuses: { performance: 1000000 },
      other_deductions: { advance: 200000 },
      dependents: 1,
      insurance_base: null
    };

    const { data: payrollRecord, error: payrollError } = await supabase
      .from('payroll_records')
      .insert(payrollData)
      .select(`
        *,
        employees:employee_id(id, full_name, employee_code),
        payroll_periods:payroll_period_id(id, period_name)
      `)
      .single();

    if (payrollError) {
      console.error('❌ Error creating payroll record:', payrollError);
      return;
    }

    console.log('✅ Payroll record created successfully!');
    console.log('📊 Payroll Summary:');
    console.log(`   Employee: ${payrollRecord.employees.full_name} (${payrollRecord.employees.employee_code})`);
    console.log(`   Period: ${payrollRecord.payroll_periods.period_name}`);
    console.log(`   Base Salary: ${payrollRecord.base_salary.toLocaleString()} VND`);
    console.log(`   Gross Salary: ${payrollRecord.gross_salary.toLocaleString()} VND`);
    console.log(`   BHXH Employee: ${payrollRecord.bhxh_employee.toLocaleString()} VND`);
    console.log(`   BHYT Employee: ${payrollRecord.bhyt_employee.toLocaleString()} VND`);
    console.log(`   BHTN Employee: ${payrollRecord.bhtn_employee.toLocaleString()} VND`);
    console.log(`   Personal Income Tax: ${payrollRecord.personal_income_tax.toLocaleString()} VND`);
    console.log(`   Total Deductions: ${payrollRecord.total_deductions.toLocaleString()} VND`);
    console.log(`   Net Salary: ${payrollRecord.net_salary.toLocaleString()} VND`);

    // Step 4: Test the API endpoint
    console.log('\n4. Testing API endpoint...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payroll/records`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ API endpoint working!');
      console.log(`   Found ${apiData.data?.length || 0} payroll records`);
    } else {
      console.log('⚠️  API endpoint returned:', response.status);
    }

    console.log('\n🎉 Payroll system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPayrollSystem();
