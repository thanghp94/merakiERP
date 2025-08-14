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

async function debugPaymentCreation() {
  console.log('🔍 Debugging payment creation issue...\n');

  try {
    // 1. Check if we have any invoices to work with
    console.log('1. Checking available invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, status')
      .limit(1);

    if (invoicesError) {
      console.log('❌ Error fetching invoices:', invoicesError.message);
      return;
    }

    if (!invoices || invoices.length === 0) {
      console.log('❌ No invoices found to test with');
      return;
    }

    const testInvoice = invoices[0];
    console.log(`✅ Using invoice: ${testInvoice.invoice_number} (${testInvoice.total_amount.toLocaleString('vi-VN')} ₫)`);

    // 2. Try to create a test payment directly in the database
    console.log('\n2. Testing direct payment creation in database...');
    const testPayment = {
      invoice_id: testInvoice.id,
      amount: 500000, // 500,000 VND
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: 'TEST-001',
      notes: 'Test payment created by debug script'
    };

    const { data: paymentResult, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert(testPayment)
      .select()
      .single();

    if (paymentError) {
      console.log('❌ Error creating payment:', paymentError.message);
      console.log('Error details:', paymentError);
      
      // Check if it's a permissions issue
      if (paymentError.code === '42501') {
        console.log('\n🔧 This looks like a permissions issue. Checking RLS policies...');
        
        // Try to check RLS policies
        const { data: policies, error: policiesError } = await supabase
          .rpc('get_policies', { table_name: 'invoice_payments' })
          .single();
          
        if (policiesError) {
          console.log('Could not check RLS policies:', policiesError.message);
        }
      }
      
      return;
    }

    console.log('✅ Payment created successfully!');
    console.log('Payment details:', paymentResult);

    // 3. Check if the payment appears in the table
    console.log('\n3. Verifying payment was saved...');
    const { data: savedPayments, error: fetchError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('id', paymentResult.id);

    if (fetchError) {
      console.log('❌ Error fetching saved payment:', fetchError.message);
      return;
    }

    if (savedPayments && savedPayments.length > 0) {
      console.log('✅ Payment found in database:', savedPayments[0]);
    } else {
      console.log('❌ Payment not found in database after creation');
    }

    // 4. Check if invoice status was updated
    console.log('\n4. Checking if invoice was updated...');
    const { data: updatedInvoice, error: invoiceUpdateError } = await supabase
      .from('invoices')
      .select('paid_amount, remaining_amount, status')
      .eq('id', testInvoice.id)
      .single();

    if (invoiceUpdateError) {
      console.log('❌ Error fetching updated invoice:', invoiceUpdateError.message);
    } else {
      console.log('✅ Invoice status after payment:');
      console.log(`   Paid amount: ${updatedInvoice.paid_amount.toLocaleString('vi-VN')} ₫`);
      console.log(`   Remaining: ${updatedInvoice.remaining_amount.toLocaleString('vi-VN')} ₫`);
      console.log(`   Status: ${updatedInvoice.status}`);
    }

    // 5. Test the API endpoint (if server is running)
    console.log('\n5. Testing payment creation via API...');
    try {
      const apiUrl = supabaseUrl.replace('/rest/v1', '') + `/api/invoices/${testInvoice.id}/payments`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 300000,
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: 'API-TEST-001',
          notes: 'Test payment via API'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API payment creation successful:', result);
      } else {
        const errorText = await response.text();
        console.log(`❌ API payment creation failed: ${response.status} ${response.statusText}`);
        console.log('Response:', errorText);
      }
    } catch (err) {
      console.log('⚠️  Could not test API (server may not be running):', err.message);
    }

    // 6. Clean up test payment
    console.log('\n6. Cleaning up test payment...');
    const { error: deleteError } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', paymentResult.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test payment:', deleteError.message);
    } else {
      console.log('✅ Test payment cleaned up');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPaymentCreation();
