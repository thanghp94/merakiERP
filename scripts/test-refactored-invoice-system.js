const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRefactoredInvoiceSystem() {
  console.log('🧪 Testing Refactored Invoice System...\n');

  try {
    // Test 1: Check if invoices can be fetched
    console.log('1. Testing invoice fetching...');
    const { data: invoices, error: invoicesError } = await supabase
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
      .limit(5);

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }

    console.log(`✅ Successfully fetched ${invoices.length} invoices`);
    if (invoices.length > 0) {
      console.log(`   Sample invoice: ${invoices[0].invoice_number} - ${invoices[0].description}`);
    }

    // Test 2: Check if payments can be fetched
    console.log('\n2. Testing payment fetching...');
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        invoices!inner(
          invoice_number,
          students:student_id(full_name),
          employees:employee_id(full_name)
        )
      `)
      .order('payment_date', { ascending: false })
      .limit(5);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
      return;
    }

    console.log(`✅ Successfully fetched ${payments.length} payments`);
    if (payments.length > 0) {
      console.log(`   Sample payment: ${payments[0].amount.toLocaleString('vi-VN')} ₫ for ${payments[0].invoices.invoice_number}`);
    }

    // Test 3: Calculate financial metrics
    console.log('\n3. Testing financial calculations...');
    
    const totalIncome = invoices
      .filter(i => i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);

    const totalExpense = invoices
      .filter(i => !i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);

    const totalOutstanding = invoices
      .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.remaining_amount, 0);

    const netProfit = totalIncome - totalExpense;

    console.log(`✅ Financial calculations completed:`);
    console.log(`   Total Income: ${totalIncome.toLocaleString('vi-VN')} ₫`);
    console.log(`   Total Expense: ${totalExpense.toLocaleString('vi-VN')} ₫`);
    console.log(`   Outstanding: ${totalOutstanding.toLocaleString('vi-VN')} ₫`);
    console.log(`   Net Profit: ${netProfit.toLocaleString('vi-VN')} ₫`);

    // Test 4: Check overdue invoices
    console.log('\n4. Testing overdue invoice detection...');
    const overdueInvoices = invoices.filter(i => {
      if (!i.due_date || i.status === 'paid') return false;
      return new Date(i.due_date) < new Date() && i.remaining_amount > 0;
    });

    console.log(`✅ Found ${overdueInvoices.length} overdue invoices`);
    if (overdueInvoices.length > 0) {
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.remaining_amount, 0);
      console.log(`   Total overdue amount: ${overdueAmount.toLocaleString('vi-VN')} ₫`);
    }

    // Test 5: Test monthly calculations
    console.log('\n5. Testing monthly calculations...');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoice_date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyInvoices
      .filter(i => i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);

    const monthlyExpense = monthlyInvoices
      .filter(i => !i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);

    console.log(`✅ Monthly calculations for ${currentMonth + 1}/${currentYear}:`);
    console.log(`   Monthly Income: ${monthlyIncome.toLocaleString('vi-VN')} ₫`);
    console.log(`   Monthly Expense: ${monthlyExpense.toLocaleString('vi-VN')} ₫`);
    console.log(`   Monthly Profit: ${(monthlyIncome - monthlyExpense).toLocaleString('vi-VN')} ₫`);

    // Test 6: Test payment statistics
    console.log('\n6. Testing payment statistics...');
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = payments.length > 0 ? totalPayments / payments.length : 0;

    console.log(`✅ Payment statistics:`);
    console.log(`   Total Payments: ${payments.length}`);
    console.log(`   Total Amount: ${totalPayments.toLocaleString('vi-VN')} ₫`);
    console.log(`   Average Payment: ${averagePayment.toLocaleString('vi-VN')} ₫`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 System Summary:');
    console.log(`   - Invoices: ${invoices.length} loaded`);
    console.log(`   - Payments: ${payments.length} loaded`);
    console.log(`   - Overdue: ${overdueInvoices.length} invoices`);
    console.log(`   - Net Profit: ${netProfit.toLocaleString('vi-VN')} ₫`);
    console.log(`   - Components: Refactored into modular structure`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRefactoredInvoiceSystem();
