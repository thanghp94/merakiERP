const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentsSync() {
  console.log('🔍 Testing payments synchronization...\n');

  try {
    // 1. Check if we have any invoices
    console.log('1. Checking existing invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, status')
      .limit(5);

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }

    console.log(`✅ Found ${invoices.length} invoices`);
    if (invoices.length > 0) {
      console.log('Sample invoices:');
      invoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.total_amount.toLocaleString('vi-VN')} ₫ (Paid: ${inv.paid_amount.toLocaleString('vi-VN')} ₫) [${inv.status}]`);
      });
    }

    // 2. Check payments using the new API endpoint
    console.log('\n2. Testing new payments API endpoint...');
    const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/payments`);
    
    if (!response.ok) {
      console.log('⚠️  API endpoint not available (this is expected if server is not running)');
      console.log('   Testing direct database query instead...');
      
      // Direct database query
      const { data: payments, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select(`
          *,
          invoices!inner(
            id,
            invoice_number,
            students:student_id(id, full_name),
            employees:employee_id(id, full_name)
          )
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError);
        return;
      }

      console.log(`✅ Found ${payments.length} payments in database`);
      if (payments.length > 0) {
        console.log('Recent payments:');
        payments.slice(0, 3).forEach(payment => {
          const payer = payment.invoices.students?.full_name || payment.invoices.employees?.full_name || 'Unknown';
          console.log(`  - ${payment.invoices.invoice_number}: ${payment.amount.toLocaleString('vi-VN')} ₫ by ${payer} on ${payment.payment_date}`);
        });
      } else {
        console.log('ℹ️  No payments found. This might be why the payments tab is empty.');
      }
    } else {
      const result = await response.json();
      console.log(`✅ API returned ${result.data?.length || 0} payments`);
    }

    // 3. Check if invoice_payments table exists and has the right structure
    console.log('\n3. Checking invoice_payments table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('invoice_payments')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ invoice_payments table does not exist!');
        console.log('   This table should be created when you make a payment through the invoice detail drawer.');
      } else {
        console.error('❌ Error checking table:', tableError);
      }
    } else {
      console.log('✅ invoice_payments table exists and is accessible');
    }

    // 4. Provide recommendations
    console.log('\n📋 Recommendations:');
    if (invoices.length === 0) {
      console.log('   • Create some test invoices first');
    } else if (payments?.length === 0) {
      console.log('   • Try making a payment through the invoice detail drawer');
      console.log('   • Click "Chi tiết" on an invoice, then use the payment form');
    } else {
      console.log('   • Payments system appears to be working correctly');
      console.log('   • Check the "Thanh toán" tab in the invoices section');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentsSync();
