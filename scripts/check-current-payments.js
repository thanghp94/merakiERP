const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentPayments() {
  console.log('🔍 Checking current payment records...\n');

  try {
    // 1. Check invoice_payments table
    console.log('1. Checking invoice_payments table...');
    const { data: invoicePayments, error: invoicePaymentsError } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        invoices!inner(
          invoice_number,
          students:student_id(full_name),
          employees:employee_id(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (invoicePaymentsError) {
      console.log('❌ Error fetching invoice_payments:', invoicePaymentsError.message);
    } else {
      console.log(`✅ Found ${invoicePayments.length} records in invoice_payments table`);
      if (invoicePayments.length > 0) {
        console.log('Recent payments:');
        invoicePayments.slice(0, 5).forEach((payment, index) => {
          const payer = payment.invoices.students?.full_name || payment.invoices.employees?.full_name || 'Unknown';
          console.log(`   ${index + 1}. ${payment.invoices.invoice_number}: ${payment.amount.toLocaleString('vi-VN')} ₫ by ${payer} on ${payment.payment_date}`);
        });
      }
    }

    // 2. Check finances table for comparison
    console.log('\n2. Checking finances table for payment records...');
    const { data: financePayments, error: financePaymentsError } = await supabase
      .from('finances')
      .select('*')
      .eq('transaction_type', 'payment')
      .order('created_at', { ascending: false });

    if (financePaymentsError) {
      console.log('❌ Error fetching finances payments:', financePaymentsError.message);
    } else {
      console.log(`✅ Found ${financePayments.length} payment records in finances table`);
      if (financePayments.length > 0) {
        console.log('Recent finance payments:');
        financePayments.slice(0, 3).forEach((payment, index) => {
          console.log(`   ${index + 1}. ${payment.amount.toLocaleString('vi-VN')} ₫ via ${payment.payment_method} on ${payment.transaction_date}`);
        });
      }
    }

    // 3. Create a test payment to verify the system works
    console.log('\n3. Creating a permanent test payment...');
    
    // Get an invoice to test with
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, remaining_amount')
      .gt('remaining_amount', 0)
      .limit(1);

    if (invoicesError || !invoices || invoices.length === 0) {
      console.log('❌ No invoices with remaining balance found');
      return;
    }

    const testInvoice = invoices[0];
    console.log(`Using invoice: ${testInvoice.invoice_number} (Remaining: ${testInvoice.remaining_amount.toLocaleString('vi-VN')} ₫)`);

    const testPayment = {
      invoice_id: testInvoice.id,
      amount: Math.min(100000, testInvoice.remaining_amount), // 100k or remaining amount, whichever is smaller
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: 'PERMANENT-TEST-001',
      notes: 'Permanent test payment for debugging'
    };

    const { data: newPayment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert(testPayment)
      .select()
      .single();

    if (paymentError) {
      console.log('❌ Error creating test payment:', paymentError.message);
    } else {
      console.log('✅ Test payment created successfully!');
      console.log(`   Payment ID: ${newPayment.id}`);
      console.log(`   Amount: ${newPayment.amount.toLocaleString('vi-VN')} ₫`);
    }

    // 4. Verify the payment appears in queries
    console.log('\n4. Re-checking invoice_payments table...');
    const { data: updatedPayments, error: updatedError } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        invoices!inner(
          invoice_number,
          students:student_id(full_name),
          employees:employee_id(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (updatedError) {
      console.log('❌ Error fetching updated payments:', updatedError.message);
    } else {
      console.log(`✅ Now found ${updatedPayments.length} total payments`);
      if (updatedPayments.length > 0) {
        console.log('All payments:');
        updatedPayments.forEach((payment, index) => {
          const payer = payment.invoices.students?.full_name || payment.invoices.employees?.full_name || 'Unknown';
          console.log(`   ${index + 1}. ${payment.invoices.invoice_number}: ${payment.amount.toLocaleString('vi-VN')} ₫ by ${payer} on ${payment.payment_date}`);
        });
      }
    }

    console.log('\n📋 Summary:');
    console.log(`- invoice_payments table: ${invoicePayments?.length || 0} records`);
    console.log(`- finances table payments: ${financePayments?.length || 0} records`);
    console.log(`- Total after test: ${updatedPayments?.length || 0} records`);
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Restart your development server (npm run dev)');
    console.log('2. Check the "Thanh toán" tab in your web app');
    console.log('3. The payments should now appear');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkCurrentPayments();
