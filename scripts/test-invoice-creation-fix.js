const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceCreation() {
  console.log('🧪 Testing Invoice Creation Fix...\n');

  // Test data for invoice creation
  const testInvoiceData = {
    description: 'Test Invoice - Date Fix',
    is_income: true,
    invoice_type: 'tuition',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '', // This should be converted to null
    notes: 'Testing empty due_date handling',
    tax_rate: 10,
    discount_amount: 0,
    items: [
      {
        item_name: 'Test Item',
        item_description: 'Test item for date fix',
        category: 'tuition_fee',
        quantity: 1,
        unit_price: 100000,
        total_amount: 100000
      }
    ]
  };

  try {
    console.log('📝 Creating test invoice with empty due_date...');
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testInvoiceData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Invoice created successfully!');
      console.log('📄 Invoice ID:', result.data.id);
      console.log('📅 Invoice Date:', result.data.invoice_date);
      console.log('📅 Due Date:', result.data.due_date || 'NULL (as expected)');
      console.log('💰 Total Amount:', result.data.total_amount);
      
      // Test with a valid due_date
      console.log('\n📝 Creating test invoice with valid due_date...');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const testInvoiceData2 = {
        ...testInvoiceData,
        description: 'Test Invoice - Valid Due Date',
        due_date: futureDate.toISOString().split('T')[0],
        items: [
          {
            item_name: 'Test Item 2',
            item_description: 'Test item with valid due date',
            category: 'tuition_fee',
            quantity: 1,
            unit_price: 150000,
            total_amount: 150000
          }
        ]
      };

      const response2 = await fetch('http://localhost:3000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInvoiceData2),
      });

      const result2 = await response2.json();

      if (response2.ok && result2.success) {
        console.log('✅ Second invoice created successfully!');
        console.log('📄 Invoice ID:', result2.data.id);
        console.log('📅 Invoice Date:', result2.data.invoice_date);
        console.log('📅 Due Date:', result2.data.due_date);
        console.log('💰 Total Amount:', result2.data.total_amount);
        
        console.log('\n🎉 All tests passed! Invoice creation fix is working correctly.');
        
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('invoice_items').delete().eq('invoice_id', result.data.id);
        await supabase.from('invoices').delete().eq('id', result.data.id);
        await supabase.from('invoice_items').delete().eq('invoice_id', result2.data.id);
        await supabase.from('invoices').delete().eq('id', result2.data.id);
        console.log('✅ Test data cleaned up successfully.');
        
      } else {
        console.error('❌ Second invoice creation failed:', result2.message);
      }
      
    } else {
      console.error('❌ Invoice creation failed:', result.message);
      console.error('Response status:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure your Next.js development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Test direct database insertion to verify the fix
async function testDirectDatabaseInsertion() {
  console.log('\n🔧 Testing direct database insertion...');
  
  try {
    // Test with null due_date
    const { data: invoice1, error: error1 } = await supabase
      .from('invoices')
      .insert({
        description: 'Direct DB Test - Null Due Date',
        is_income: true,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: null, // Explicitly null
        tax_rate: 0,
        discount_amount: 0,
        status: 'draft'
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Direct insertion with null due_date failed:', error1.message);
    } else {
      console.log('✅ Direct insertion with null due_date successful');
      console.log('📄 Invoice ID:', invoice1.id);
      console.log('📅 Due Date:', invoice1.due_date);
      
      // Clean up
      await supabase.from('invoices').delete().eq('id', invoice1.id);
    }

    // Test with valid due_date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    
    const { data: invoice2, error: error2 } = await supabase
      .from('invoices')
      .insert({
        description: 'Direct DB Test - Valid Due Date',
        is_income: true,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: futureDate.toISOString().split('T')[0],
        tax_rate: 0,
        discount_amount: 0,
        status: 'draft'
      })
      .select()
      .single();

    if (error2) {
      console.error('❌ Direct insertion with valid due_date failed:', error2.message);
    } else {
      console.log('✅ Direct insertion with valid due_date successful');
      console.log('📄 Invoice ID:', invoice2.id);
      console.log('📅 Due Date:', invoice2.due_date);
      
      // Clean up
      await supabase.from('invoices').delete().eq('id', invoice2.id);
    }

  } catch (error) {
    console.error('❌ Direct database test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Invoice Creation Fix Tests\n');
  
  // Test direct database operations first
  await testDirectDatabaseInsertion();
  
  // Test API endpoint
  await testInvoiceCreation();
  
  console.log('\n✨ Test completed!');
}

main().catch(console.error);
