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

async function testPaymentCreation() {
  console.log('🧪 Testing fixed payment creation...\n');

  try {
    // 1. Get an invoice to test with
    console.log('1. Getting invoice to test with...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, paid_amount, remaining_amount, status')
      .limit(1);

    if (invoicesError || !invoices || invoices.length === 0) {
      console.log('❌ No invoices found to test with');
      return;
    }

    const testInvoice = invoices[0];
    console.log(`✅ Using invoice: ${testInvoice.invoice_number}`);
    console.log(`   Total: ${testInvoice.total_amount.toLocaleString('vi-VN')} ₫`);
    console.log(`   Paid: ${testInvoice.paid_amount.toLocaleString('vi-VN')} ₫`);
    console.log(`   Remaining: ${testInvoice.remaining_amount.toLocaleString('vi-VN')} ₫`);
    console.log(`   Status: ${testInvoice.status}`);

    // 2. Create a test payment directly in invoice_payments table
    console.log('\n2. Creating test payment in invoice_payments table...');
    const testPayment = {
      invoice_id: testInvoice.id,
      amount: 500000, // 500,000 VND
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: 'TEST-FIXED-001',
      notes: 'Test payment after fixing API'
    };

    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert(testPayment)
      .select()
      .single();

    if (paymentError) {
      console.log('❌ Error creating payment:', paymentError.message);
      console.log('Error details:', paymentError);
      return;
    }

    console.log('✅ Payment created successfully!');
    console.log('Payment ID:', payment.id);
    console.log('Amount:', payment.amount.toLocaleString('vi-VN'), '₫');

    // 3. Check if payment appears in the table
    console.log('\n3. Verifying payment in database...');
    const { data: allPayments, error: fetchError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', testInvoice.id);

    if (fetchError) {
      console.log('❌ Error fetching payments:', fetchError.message);
    } else {
      console.log(`✅ Found ${allPayments.length} payment(s) for this invoice:`);
      allPayments.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.amount.toLocaleString('vi-VN')} ₫ via ${p.payment_method} on ${p.payment_date}`);
      });
    }

    // 4. Check if invoice was updated by triggers
    console.log('\n4. Checking if invoice was updated...');
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('paid_amount, remaining_amount, status')
      .eq('id', testInvoice.id)
      .single();

    if (invoiceError) {
      console.log('❌ Error fetching updated invoice:', invoiceError.message);
    } else {
      console.log('✅ Invoice after payment:');
      console.log(`   Paid: ${updatedInvoice.paid_amount.toLocaleString('vi-VN')} ₫`);
      console.log(`   Remaining: ${updatedInvoice.remaining_amount.toLocaleString('vi-VN')} ₫`);
      console.log(`   Status: ${updatedInvoice.status}`);
    }

    // 5. Test the payments API endpoint
    console.log('\n5. Testing /api/payments endpoint...');
    try {
      const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/payments`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Payments API working! Found ${result.data?.length || 0} payments`);
        if (result.data && result.data.length > 0) {
          console.log('Recent payments:');
          result.data.slice(0, 3).forEach((p, index) => {
            console.log(`   ${index + 1}. ${p.amount.toLocaleString('vi-VN')} ₫ on ${p.payment_date}`);
          });
        }
      } else {
        console.log(`⚠️  Payments API returned: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.log('⚠️  Could not test payments API (server may not be running)');
    }

    console.log('\n🎉 Payment creation test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your web app at http://localhost:3005/dashboard');
    console.log('2. Navigate to Finance tab → Thanh toán tab');
    console.log('3. You should now see the test payment listed');
    console.log('4. Try creating more payments through the invoice detail drawer');

    // Clean up test payment
    console.log('\n6. Cleaning up test payment...');
    const { error: deleteError } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', payment.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test payment:', deleteError.message);
    } else {
      console.log('✅ Test payment cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentCreation();
