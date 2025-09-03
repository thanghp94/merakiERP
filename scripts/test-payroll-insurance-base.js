const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayrollWithInsuranceBase() {
  console.log('🧪 Testing payroll creation with insurance_base field...\n');

  try {
    // First, let's check if we have any payroll periods
    const { data: periods, error: periodError } = await supabase
      .from('payroll_periods')
      .select('*')
      .limit(1);

    if (periodError) {
      console.error('❌ Error fetching payroll periods:', periodError);
      return;
    }

    if (!periods || periods.length === 0) {
      console.log('⚠️  No payroll periods found. Creating a test payroll period...');

      const { data: newPeriod, error: createPeriodError } = await supabase
        .from('payroll_periods')
        .insert({
          period_name: 'Test Period - March 2024',
          start_date: '2024-03-01',
          end_date: '2024-03-31',
          status: 'active'
        })
        .select()
        .single();

      if (createPeriodError) {
        console.error('❌ Error creating test payroll period:', createPeriodError);
        return;
      }

      periods.push(newPeriod);
    }

    const payrollPeriodId = periods[0].id;
    console.log(`📅 Using payroll period: ${periods[0].period_name} (ID: ${payrollPeriodId})`);

    // Check if we have any employees
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (employeeError) {
      console.error('❌ Error fetching employees:', employeeError);
      return;
    }

    if (!employees || employees.length === 0) {
      console.log('⚠️  No employees found. Creating a test employee...');

      const { data: newEmployee, error: createEmployeeError } = await supabase
        .from('employees')
        .insert({
          full_name: 'Test Employee',
          employee_code: 'TEST001',
          base_salary: 15000000, // 15 million VND
          data: {
            department: 'Test Department',
            position: 'Test Position'
          }
        })
        .select()
        .single();

      if (createEmployeeError) {
        console.error('❌ Error creating test employee:', createEmployeeError);
        return;
      }

      employees.push(newEmployee);
    }

    const employeeId = employees[0].id;
    console.log(`👤 Using employee: ${employees[0].full_name} (ID: ${employeeId})`);

    // Test payroll creation with insurance_base
    const testData = {
      employee_id: employeeId,
      payroll_period_id: payrollPeriodId,
      base_salary: employees[0].base_salary,
      insurance_base: 12000000, // 12 million VND (different from base salary)
      working_days: 26,
      actual_working_days: 26,
      allowances: { 'meal': 1000000, 'transport': 500000 },
      bonuses: { 'performance': 2000000 },
      other_deductions: { 'advance': 500000 },
      dependents: 1
    };

    console.log('\n📊 Test Data:');
    console.log(`   Base Salary: ${testData.base_salary.toLocaleString()} VND`);
    console.log(`   Insurance Base: ${testData.insurance_base.toLocaleString()} VND`);
    console.log(`   Working Days: ${testData.actual_working_days}/${testData.working_days}`);
    console.log(`   Allowances: ${JSON.stringify(testData.allowances)}`);
    console.log(`   Bonuses: ${JSON.stringify(testData.bonuses)}`);
    console.log(`   Other Deductions: ${JSON.stringify(testData.other_deductions)}`);
    console.log(`   Dependents: ${testData.dependents}`);

    // Make API call to create payroll record
    const response = await fetch('http://localhost:3000/api/payroll/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ Payroll record created successfully!');
      console.log('\n📋 Payroll Calculation Results:');
      console.log(`   Gross Salary: ${result.data.gross_salary?.toLocaleString()} VND`);
      console.log(`   Insurance Base: ${result.data.insurance_base?.toLocaleString()} VND`);
      console.log(`   BHXH Employee: ${result.data.bhxh_employee?.toLocaleString()} VND`);
      console.log(`   BHYT Employee: ${result.data.bhyt_employee?.toLocaleString()} VND`);
      console.log(`   BHTN Employee: ${result.data.bhtn_employee?.toLocaleString()} VND`);
      console.log(`   Personal Income Tax: ${result.data.personal_income_tax?.toLocaleString()} VND`);
      console.log(`   Total Deductions: ${result.data.total_deductions?.toLocaleString()} VND`);
      console.log(`   Net Salary: ${result.data.net_salary?.toLocaleString()} VND`);

      // Verify insurance_base was stored correctly
      if (result.data.insurance_base === testData.insurance_base) {
        console.log('\n✅ Insurance base field stored correctly!');
      } else {
        console.log('\n❌ Insurance base field not stored correctly!');
        console.log(`   Expected: ${testData.insurance_base}, Got: ${result.data.insurance_base}`);
      }

      // Clean up test data
      console.log('\n🧹 Cleaning up test data...');
      await supabase
        .from('payroll_records')
        .delete()
        .eq('id', result.data.id);

      console.log('✅ Test completed successfully!');
    } else {
      console.error('❌ Failed to create payroll record:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPayrollWithInsuranceBase();
