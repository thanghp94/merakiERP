const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceData() {
  console.log('🔍 Testing invoice data...');

  try {
    // Check if invoices table exists and has data
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(5);

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }

    console.log(`📊 Found ${invoices?.length || 0} invoices in database`);

    if (!invoices || invoices.length === 0) {
      console.log('📝 Creating sample invoice data...');
      await createSampleInvoices();
    } else {
      console.log('✅ Invoice data exists:');
      invoices.forEach((invoice, index) => {
        console.log(`  ${index + 1}. ${invoice.description} - ${invoice.is_income ? 'Thu' : 'Chi'} - ${invoice.status}`);
      });
    }

    // Test the API endpoint (skip if server not running)
    console.log('\n🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/invoices');
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Response:', {
          success: result.success,
          dataCount: result.data?.length || 0
        });
      } else {
        console.log('❌ API Error:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.log('⚠️ API test skipped (server not running)');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function createSampleInvoices() {
  try {
    // Get some students and employees for sample data
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(3);

    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(3);

    const sampleInvoices = [
      {
        description: 'Học phí tháng 12/2024',
        is_income: true,
        student_id: students?.[0]?.id || null,
        invoice_date: '2024-12-01',
        due_date: '2024-12-15',
        status: 'pending',
        tax_rate: 10,
        discount_amount: 0,
        notes: 'Học phí cho khóa học tiếng Anh cơ bản'
      },
      {
        description: 'Lương tháng 12/2024',
        is_income: false,
        employee_id: employees?.[0]?.id || null,
        invoice_date: '2024-12-01',
        due_date: '2024-12-05',
        status: 'paid',
        tax_rate: 0,
        discount_amount: 0,
        notes: 'Lương tháng 12 cho giáo viên'
      },
      {
        description: 'Phí đăng ký khóa học IELTS',
        is_income: true,
        student_id: students?.[1]?.id || null,
        invoice_date: '2024-12-02',
        due_date: '2024-12-20',
        status: 'draft',
        tax_rate: 10,
        discount_amount: 50000,
        notes: 'Khóa học IELTS 6.5+'
      }
    ];

    for (const invoiceData of sampleInvoices) {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        continue;
      }

      // Create sample items for each invoice
      const sampleItems = [
        {
          invoice_id: invoice.id,
          item_name: invoiceData.is_income ? 'Học phí' : 'Lương cơ bản',
          item_description: invoiceData.is_income ? 'Học phí khóa học' : 'Lương tháng',
          category: invoiceData.is_income ? 'tuition' : 'salary',
          quantity: 1,
          unit_price: invoiceData.is_income ? 2000000 : 15000000,
          total_amount: invoiceData.is_income ? 2000000 : 15000000
        }
      ];

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(sampleItems);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
      } else {
        console.log(`✅ Created invoice: ${invoiceData.description}`);
      }
    }

  } catch (error) {
    console.error('Error creating sample invoices:', error);
  }
}

// Run the test
testInvoiceData();
