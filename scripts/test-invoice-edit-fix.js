const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceEditData() {
  console.log('🧪 Testing Invoice Edit Data Structure...\n');
  
  try {
    // Get an invoice with its items (simulating what the edit form would receive)
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        students:student_id(id, full_name),
        employees:employee_id(id, full_name),
        facilities:facility_id(id, name),
        classes:class_id(id, class_name),
        invoice_items(*)
      `)
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching invoice:', error);
      return;
    }

    if (!invoice) {
      console.log('⚠️ No invoices found in database');
      return;
    }

    console.log('📋 Invoice data structure that will be passed to edit form:');
    console.log('Invoice ID:', invoice.id);
    console.log('Invoice Number:', invoice.invoice_number);
    console.log('Description:', invoice.description);
    console.log('Total Amount:', invoice.total_amount);
    console.log('Invoice Items Count:', invoice.invoice_items?.length || 0);
    
    if (invoice.invoice_items && invoice.invoice_items.length > 0) {
      console.log('\n📦 Invoice Items:');
      invoice.invoice_items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.item_name}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Unit Price: ${item.unit_price.toLocaleString('vi-VN')} ₫`);
        console.log(`     Total: ${item.total_amount.toLocaleString('vi-VN')} ₫`);
      });
    }

    console.log('\n✅ The fixed InvoiceFormNew component should now:');
    console.log('1. Map invoice_items to items array');
    console.log('2. Format dates correctly (remove time part)');
    console.log('3. Populate all form fields with existing data');
    console.log('4. Show item amounts and calculations');

    console.log('\n🔧 Key fix applied:');
    console.log('- Added proper data mapping in useEffect for initialData');
    console.log('- Maps invoice_items → items');
    console.log('- Formats dates to YYYY-MM-DD format');
    console.log('- Ensures all foreign keys are properly set');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInvoiceEditData();
