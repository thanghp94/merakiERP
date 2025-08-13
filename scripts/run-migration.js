const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to add current_unit column...');
    
    // Add current_unit column
    const { data: addColumn, error: addColumnError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'ALTER TABLE classes ADD COLUMN IF NOT EXISTS current_unit VARCHAR(10);' 
      });
    
    if (addColumnError) {
      console.error('Error adding column:', addColumnError);
      return;
    }
    
    console.log('Column added successfully');
    
    // Create index
    const { data: createIndex, error: createIndexError } = await supabase
      .rpc('exec_sql', { 
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_classes_current_unit ON classes(current_unit);' 
      });
    
    if (createIndexError) {
      console.error('Error creating index:', createIndexError);
      return;
    }
    
    console.log('Index created successfully');
    
    // Update existing records
    const { data: updateRecords, error: updateError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `UPDATE classes 
                   SET current_unit = data->>'unit' 
                   WHERE data->>'unit' IS NOT NULL AND current_unit IS NULL;` 
      });
    
    if (updateError) {
      console.error('Error updating records:', updateError);
      return;
    }
    
    console.log('Migration completed successfully!');
    
  } catch (err) {
    console.error('Error running migration:', err);
  }
}

runMigration();
