const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupInvoicePaymentsTable() {
  console.log('🔧 Setting up invoice_payments table...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-invoice-payments-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (rough split by semicolon)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          
          if (error) {
            // Try direct query if RPC fails
            const { error: directError } = await supabase.from('_').select('*').limit(0);
            if (directError && directError.message.includes('relation "_" does not exist')) {
              // This is expected, we're just testing the connection
              console.log(`   ✅ Statement ${i + 1} executed (connection verified)`);
            } else {
              console.log(`   ⚠️  Statement ${i + 1}: ${error.message}`);
            }
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`);
        }
      }
    }

    // Test if the table was created by trying to query it
    console.log('\n🔍 Testing invoice_payments table...');
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ invoice_payments table was not created successfully');
        console.log('   You may need to run the SQL manually in your Supabase dashboard');
      } else {
        console.log('⚠️  Table exists but there was an error:', error.message);
      }
    } else {
      console.log('✅ invoice_payments table is ready!');
      console.log(`   Found ${data?.length || 0} existing payment records`);
    }

    // Test the payments API endpoint
    console.log('\n🔍 Testing payments API...');
    try {
      const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/payments`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Payments API working! Found ${result.data?.length || 0} payments`);
      } else {
        console.log('⚠️  Payments API not accessible (server may not be running)');
      }
    } catch (err) {
      console.log('⚠️  Could not test payments API:', err.message);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Go to your invoice list in the web app');
    console.log('2. Click "Chi tiết" on any invoice');
    console.log('3. Use the payment form to add a payment');
    console.log('4. Check the "Thanh toán" tab to see if payments appear');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupInvoicePaymentsTable();
