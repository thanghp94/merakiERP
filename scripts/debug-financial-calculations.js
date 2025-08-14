const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFinancialCalculations() {
  console.log('🔍 Debugging Financial Calculations...\n');
  
  try {
    // Get all invoices with their status
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, is_income, status, total_amount, paid_amount, remaining_amount')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('📊 Invoice Status Breakdown:');
    console.log('Total invoices:', invoices.length);
    
    const statusCounts = {};
    const incomeByStatus = {};
    const expenseByStatus = {};
    
    invoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
      
      if (inv.is_income) {
        incomeByStatus[inv.status] = (incomeByStatus[inv.status] || 0) + inv.total_amount;
      } else {
        expenseByStatus[inv.status] = (expenseByStatus[inv.status] || 0) + inv.total_amount;
      }
    });
    
    console.log('\nStatus counts:', statusCounts);
    console.log('\nIncome by status:', incomeByStatus);
    console.log('\nExpense by status:', expenseByStatus);
    
    // Current calculation logic
    const totalIncome = invoices
      .filter(i => i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);
      
    const totalExpense = invoices
      .filter(i => !i.is_income && i.status === 'paid')
      .reduce((sum, i) => sum + i.total_amount, 0);
      
    const totalOutstanding = invoices
      .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.remaining_amount, 0);
      
    console.log('\n💰 Current Calculation Results:');
    console.log('Total Income (paid only):', totalIncome.toLocaleString('vi-VN'), '₫');
    console.log('Total Expense (paid only):', totalExpense.toLocaleString('vi-VN'), '₫');
    console.log('Total Outstanding:', totalOutstanding.toLocaleString('vi-VN'), '₫');
    
    // Alternative calculation including all statuses
    const allIncome = invoices
      .filter(i => i.is_income)
      .reduce((sum, i) => sum + i.total_amount, 0);
      
    const allExpense = invoices
      .filter(i => !i.is_income)
      .reduce((sum, i) => sum + i.total_amount, 0);
      
    console.log('\n📈 Alternative Calculation (all invoices):');
    console.log('All Income:', allIncome.toLocaleString('vi-VN'), '₫');
    console.log('All Expense:', allExpense.toLocaleString('vi-VN'), '₫');
    
    // Show sample invoices
    console.log('\n📋 Sample Invoices:');
    invoices.slice(0, 5).forEach(inv => {
      console.log(`- ${inv.invoice_number}: ${inv.is_income ? 'Income' : 'Expense'} | Status: ${inv.status} | Amount: ${inv.total_amount.toLocaleString('vi-VN')} ₫`);
    });

    // Check if we need to update invoice statuses
    const draftInvoices = invoices.filter(i => i.status === 'draft');
    if (draftInvoices.length > 0) {
      console.log('\n⚠️  Found', draftInvoices.length, 'draft invoices. These are not counted in totals.');
      console.log('Consider updating their status to "sent" or "paid" to include them in calculations.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugFinancialCalculations();
