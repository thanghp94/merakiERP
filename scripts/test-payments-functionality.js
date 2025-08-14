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

async function testPaymentsFunctionality() {
  console.log('🧪 Testing payments functionality...\n');

  try {
    // 1. Check if invoice_payments table exists and is accessible
    console.log('1. Testing invoice_payments table...');
    const { data: paymentsTest, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*')
      .limit(1);

    if (paymentsError) {
      console.log('❌ invoice_payments table error:', paymentsError.message);
      return;
    } else {
      console.log('✅ invoice_payments table is accessible');
    }

    // 2. Check existing invoices
    console.log('\n2. Checking existing invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, status')
      .limit(5);

    if (invoicesError) {
      console.log('❌ Error fetching invoices:', invoicesError.message);
      return;
    }

    console.log(`✅ Found ${invoices.length} invoices`);
    if (invoices.length > 0) {
      console.log('Sample invoices:');
      invoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.total_amount.toLocaleString('vi-VN')} ₫ (Status: ${inv.status})`);
      });
    }

    // 3. Check existing payments
    console.log('\n3. Checking existing payments...');
    const { data: payments, error: paymentsListError } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        invoices!inner(
          invoice_number,
          students:student_id(full_name),
          employees:employee_id(full_name)
        )
      `)
      .order('payment_date', { ascending: false });

    if (paymentsListError) {
      console.log('❌ Error fetching payments:', paymentsListError.message);
      return;
    }

    console.log(`✅ Found ${payments.length} payments`);
    if (payments.length > 0) {
      console.log('Recent payments:');
      payments.slice(0, 3).forEach(payment => {
        const payer = payment.invoices.students?.full_name || payment.invoices.employees?.full_name || 'Unknown';
        console.log(`  - ${payment.invoices.invoice_number}: ${payment.amount.toLocaleString('vi-VN')} ₫ by ${payer} on ${payment.payment_date}`);
      });
    } else {
      console.log('ℹ️  No payments found yet. Try making a payment through the web interface.');
    }

    // 4. Test the new payments API endpoint (if server is running)
    console.log('\n4. Testing payments API endpoint...');
    try {
      const apiUrl = supabaseUrl.replace('/rest/v1', '') + '/api/payments';
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Payments API working! Returns ${result.data?.length || 0} payments`);
      } else {
        console.log('⚠️  Payments API returned error:', response.status, response.statusText);
      }
    } catch (err) {
      console.log('⚠️  Could not test payments API (server may not be running)');
    }

    console.log('\n📋 Status Summary:');
    console.log(`✅ Database table: invoice_payments exists`);
    console.log(`✅ Invoices available: ${invoices.length}`);
    console.log(`✅ Payments recorded: ${payments.length}`);
    
    if (payments.length === 0) {
      console.log('\n🎯 Next Steps:');
      console.log('1. Go to your web app at http://localhost:3005/dashboard');
      console.log('2. Navigate to the Finance tab');
      console.log('3. Click "Chi tiết" on any invoice');
      console.log('4. Use the payment form to add a test payment');
      console.log('5. Check the "Thanh toán" tab to see if it appears');
    } else {
      console.log('\n🎉 Payments system is working! Check the "Thanh toán" tab in your web app.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentsFunctionality();
