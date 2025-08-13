const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateFinancesSchema() {
  console.log('🔄 Migrating finances schema...\n');

  try {
    // Step 1: Add missing columns to existing finances table
    console.log('1. Adding missing columns to finances table...');
    
    const alterTableSQL = `
      -- Add new columns if they don't exist
      ALTER TABLE finances 
      ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id),
      ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id),
      ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id),
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS reference_number TEXT,
      ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS due_date DATE,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS transaction_type TEXT;

      -- Update existing records to have proper is_income values
      UPDATE finances 
      SET is_income = CASE 
        WHEN type = 'income' THEN true 
        ELSE false 
      END
      WHERE is_income IS NULL;

      -- Update transaction_type to match category for backward compatibility
      UPDATE finances 
      SET transaction_type = category 
      WHERE transaction_type IS NULL;
    `;

    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
    
    if (alterError) {
      console.error('❌ Error altering finances table:', alterError.message);
    } else {
      console.log('✅ Successfully added missing columns to finances table');
    }

    // Step 2: Create finance_items table if it doesn't exist
    console.log('\n2. Creating finance_items table...');
    
    const createItemsTableSQL = `
      CREATE TABLE IF NOT EXISTS finance_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        finance_id UUID NOT NULL REFERENCES finances(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        item_description TEXT DEFAULT '',
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_finance_items_finance_id ON finance_items(finance_id);
    `;

    const { error: itemsError } = await supabase.rpc('exec_sql', { sql: createItemsTableSQL });
    
    if (itemsError) {
      console.error('❌ Error creating finance_items table:', itemsError.message);
    } else {
      console.log('✅ Successfully created finance_items table');
    }

    // Step 3: Create payment_schedules table if it doesn't exist
    console.log('\n3. Creating payment_schedules table...');
    
    const createSchedulesTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_schedules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID REFERENCES students(id),
        class_id UUID REFERENCES classes(id),
        total_amount DECIMAL(15,2) NOT NULL,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        remaining_amount DECIMAL(15,2) NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_payment_schedules_student_id ON payment_schedules(student_id);
      CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
      CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);
    `;

    const { error: schedulesError } = await supabase.rpc('exec_sql', { sql: createSchedulesTableSQL });
    
    if (itemsError) {
      console.error('❌ Error creating payment_schedules table:', schedulesError.message);
    } else {
      console.log('✅ Successfully created payment_schedules table');
    }

    // Step 4: Test the updated schema
    console.log('\n4. Testing updated schema...');
    
    const { data: testData, error: testError } = await supabase
      .from('finances')
      .select('id, amount, description, is_income, payment_method')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing updated schema:', testError.message);
    } else {
      console.log('✅ Schema test successful');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your dashboard to use FinancesTabNew component');
    console.log('2. Test creating transactions with multiple items');
    console.log('3. Verify data is being saved correctly');

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
  }
}

// Helper function to execute raw SQL (if not available as RPC)
async function execSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    return { data, error };
  } catch (err) {
    // If exec_sql RPC doesn't exist, we'll need to run SQL manually
    console.log('⚠️  exec_sql RPC not available. Please run the SQL manually in Supabase dashboard:');
    console.log('\n--- SQL TO RUN ---');
    console.log(sql);
    console.log('--- END SQL ---\n');
    return { data: null, error: null };
  }
}

migrateFinancesSchema();
