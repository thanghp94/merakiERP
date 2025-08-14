const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.error('Could not load .env.local file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('📝 Please check your .env.local file');
  console.log('🔍 Looking for:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Supabase configuration loaded');
console.log('🔗 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceAPI() {
  console.log('🔍 Testing Invoice API and Financial Data...\n');

  try {
    // 1. Check if invoices table exists and get current data
    console.log('1. Checking existing invoices...');
    const { data: existingInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        students:student_id(id, full_name),
        employees:employee_id(id, full_name),
        facilities:facility_id(id, name),
        classes:class_id(id, class_name),
        invoice_items(*)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError);
      return;
    }

    console.log(`📊 Found ${existingInvoices?.length || 0} existing invoices`);
    
    if (existingInvoices && existingInvoices.length > 0) {
      console.log('💰 Financial Summary from existing invoices:');
      
      const totalIncome = existingInvoices
        .filter(i => i.is_income && ['paid', 'partial'].includes(i.status))
        .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

      const totalExpense = existingInvoices
        .filter(i => !i.is_income && ['paid', 'partial'].includes(i.status))
        .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

      const totalOutstanding = existingInvoices
        .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + (i.remaining_amount || 0), 0);

      console.log(`   - Total Income: ${totalIncome.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Total Expense: ${totalExpense.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Outstanding: ${totalOutstanding.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Net Profit: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫\n`);
      
      // Show first few invoices
      console.log('📋 Recent invoices:');
      existingInvoices.slice(0, 3).forEach(invoice => {
        console.log(`   - ${invoice.invoice_number}: ${invoice.total_amount?.toLocaleString('vi-VN')} ₫ (${invoice.status})`);
      });
      console.log('');
    }

    // 2. Get some students and employees for sample data
    console.log('2. Getting students and employees for sample data...');
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(3);

    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(2);

    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name')
      .limit(2);

    console.log(`👥 Found ${students?.length || 0} students, ${employees?.length || 0} employees, ${facilities?.length || 0} facilities`);

    // 3. Create sample invoices if we have less than 5
    if (!existingInvoices || existingInvoices.length < 5) {
      console.log('\n3. Creating sample invoices...');
      
      const sampleInvoices = [];
      
      // Income invoices (tuition)
      if (students && students.length > 0) {
        sampleInvoices.push({
          student_id: students[0].id,
          is_income: true,
          invoice_type: 'tuition',
          description: `Học phí tháng ${new Date().getMonth() + 1} - ${students[0].full_name}`,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'sent',
          items: [
            {
              item_name: 'Học phí GrapeSEED',
              item_description: 'Học phí tháng',
              category: 'tuition',
              quantity: 1,
              unit_price: 2500000
            }
          ]
        });

        if (students.length > 1) {
          sampleInvoices.push({
            student_id: students[1].id,
            is_income: true,
            invoice_type: 'tuition',
            description: `Học phí tháng ${new Date().getMonth() + 1} - ${students[1].full_name}`,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'paid',
            items: [
              {
                item_name: 'Học phí Pre-WSC',
                item_description: 'Học phí tháng',
                category: 'tuition',
                quantity: 1,
                unit_price: 3000000
              }
            ]
          });
        }
      }

      // Expense invoices
      if (employees && employees.length > 0) {
        sampleInvoices.push({
          employee_id: employees[0].id,
          is_income: false,
          invoice_type: 'payroll',
          description: `Lương tháng ${new Date().getMonth() + 1} - ${employees[0].full_name}`,
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          items: [
            {
              item_name: 'Lương cơ bản',
              item_description: 'Lương tháng',
              category: 'salary',
              quantity: 1,
              unit_price: 15000000
            }
          ]
        });
      }

      if (facilities && facilities.length > 0) {
        sampleInvoices.push({
          facility_id: facilities[0].id,
          is_income: false,
          invoice_type: 'expense',
          description: `Chi phí vận hành - ${facilities[0].name}`,
          invoice_date: new Date().toISOString().split('T')[0],
          status: 'paid',
          items: [
            {
              item_name: 'Tiền điện',
              item_description: 'Hóa đơn điện tháng',
              category: 'utilities',
              quantity: 1,
              unit_price: 2000000
            },
            {
              item_name: 'Tiền nước',
              item_description: 'Hóa đơn nước tháng',
              category: 'utilities',
              quantity: 1,
              unit_price: 500000
            }
          ]
        });
      }

      // Create the invoices
      for (const invoiceData of sampleInvoices) {
        try {
          console.log(`   Creating invoice: ${invoiceData.description}`);
          
          // Create invoice
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              student_id: invoiceData.student_id || null,
              employee_id: invoiceData.employee_id || null,
              facility_id: invoiceData.facility_id || null,
              is_income: invoiceData.is_income,
              invoice_type: invoiceData.invoice_type,
              description: invoiceData.description,
              invoice_date: invoiceData.invoice_date,
              due_date: invoiceData.due_date || null,
              status: invoiceData.status
            })
            .select()
            .single();

          if (invoiceError) {
            console.error(`   ❌ Error creating invoice: ${invoiceError.message}`);
            continue;
          }

          // Create invoice items
          const itemsToInsert = invoiceData.items.map(item => ({
            invoice_id: invoice.id,
            item_name: item.item_name,
            item_description: item.item_description,
            category: item.category,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.quantity * item.unit_price
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) {
            console.error(`   ❌ Error creating invoice items: ${itemsError.message}`);
            continue;
          }

          // If invoice is paid, create a finance record
          if (invoiceData.status === 'paid') {
            const totalAmount = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            
            const { error: financeError } = await supabase
              .from('finances')
              .insert({
                invoice_id: invoice.id,
                student_id: invoiceData.student_id || null,
                employee_id: invoiceData.employee_id || null,
                facility_id: invoiceData.facility_id || null,
                amount: totalAmount,
                transaction_type: invoiceData.is_income ? 'payment' : 'expense',
                transaction_date: invoiceData.invoice_date,
                status: 'completed',
                is_income: invoiceData.is_income,
                payment_method: 'bank_transfer'
              });

            if (financeError) {
              console.error(`   ⚠️  Warning: Could not create finance record: ${financeError.message}`);
            }
          }

          console.log(`   ✅ Created invoice: ${invoice.invoice_number}`);
          
        } catch (error) {
          console.error(`   ❌ Unexpected error creating invoice: ${error.message}`);
        }
      }
    }

    // 4. Final check - get updated financial data
    console.log('\n4. Final financial summary...');
    const { data: finalInvoices, error: finalError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Error fetching final invoices:', finalError);
      return;
    }

    if (finalInvoices && finalInvoices.length > 0) {
      const totalIncome = finalInvoices
        .filter(i => i.is_income && ['paid', 'partial'].includes(i.status))
        .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

      const totalExpense = finalInvoices
        .filter(i => !i.is_income && ['paid', 'partial'].includes(i.status))
        .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

      const totalOutstanding = finalInvoices
        .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + (i.remaining_amount || 0), 0);

      console.log('💰 Updated Financial Summary:');
      console.log(`   - Total Income: ${totalIncome.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Total Expense: ${totalExpense.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Outstanding: ${totalOutstanding.toLocaleString('vi-VN')} ₫`);
      console.log(`   - Net Profit: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫`);
      console.log(`   - Total Invoices: ${finalInvoices.length}`);
    }

    console.log('\n✅ Invoice API test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Go to the dashboard and check the Tài chính tab');
    console.log('   3. The financial summary cards should now show data');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testInvoiceAPI();
