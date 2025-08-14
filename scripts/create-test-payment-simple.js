const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestPayment() {
  console.log('Creating test payment...');

  try {
    // Get first invoice
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .limit(1);

    if (!invoices || invoices.length === 0) {
      console.log('No invoices found');
      return;
    }

    const invoice = invoices[0];
    console.log(`Using invoice: ${invoice.invoice_number}`);

    // Create payment
    const { data: payment, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: invoice.id,
        amount: 100000,
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: 'TEST-001',
        notes: 'Test payment'
      })
      .select()
      .single();

    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Payment created:', payment.id);
      console.log('Amount:', payment.amount);
    }

    // Check total payments
    const { data: allPayments } = await supabase
      .from('invoice_payments')
      .select('*');

    console.log(`Total payments in database: ${allPayments?.length || 0}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestPayment();
