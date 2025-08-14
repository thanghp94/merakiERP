const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInvoiceCalculations() {
  console.log('🔧 Fixing Invoice Calculations...\n');
  
  try {
    // Get all invoices with their current values
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount, paid_amount, remaining_amount')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    console.log('📊 Current Invoice Data:');
    invoices.forEach(inv => {
      console.log(`- ${inv.invoice_number}: Status=${inv.status}, Total=${inv.total_amount}, Paid=${inv.paid_amount}, Remaining=${inv.remaining_amount}`);
    });

    // Check if we have payments for these invoices
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('invoice_id, amount')
      .in('invoice_id', invoices.map(i => i.id));

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return;
    }

    console.log('\n💰 Payments found:', payments.length);
    payments.forEach(p => {
      const invoice = invoices.find(i => i.id === p.invoice_id);
      console.log(`- Payment for ${invoice?.invoice_number}: ${p.amount.toLocaleString('vi-VN')} ₫`);
    });

    // Update invoice calculations based on payments
    for (const invoice of invoices) {
      const invoicePayments = payments.filter(p => p.invoice_id === invoice.id);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = invoice.total_amount - totalPaid;
      
      let newStatus = invoice.status;
      if (totalPaid === 0) {
        newStatus = 'sent'; // or 'draft' depending on your business logic
      } else if (totalPaid >= invoice.total_amount) {
        newStatus = 'paid';
      } else {
        newStatus = 'partial';
      }

      // Update the invoice if values have changed
      if (totalPaid !== invoice.paid_amount || remaining !== invoice.remaining_amount || newStatus !== invoice.status) {
        console.log(`\n🔄 Updating ${invoice.invoice_number}:`);
        console.log(`  Status: ${invoice.status} → ${newStatus}`);
        console.log(`  Paid: ${invoice.paid_amount} → ${totalPaid}`);
        console.log(`  Remaining: ${invoice.remaining_amount} → ${remaining}`);

        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            paid_amount: totalPaid,
            remaining_amount: remaining,
            status: newStatus
          })
          .eq('id', invoice.id);

        if (updateError) {
          console.error(`❌ Error updating ${invoice.invoice_number}:`, updateError);
        } else {
          console.log(`✅ Updated ${invoice.invoice_number} successfully`);
        }
      }
    }

    // Recalculate totals after updates
    const { data: updatedInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, is_income, status, total_amount, paid_amount, remaining_amount')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching updated invoices:', fetchError);
      return;
    }

    console.log('\n📈 Updated Financial Totals:');
    
    const totalIncome = updatedInvoices
      .filter(i => i.is_income && ['paid', 'partial'].includes(i.status))
      .reduce((sum, i) => sum + i.paid_amount, 0);

    const totalExpense = updatedInvoices
      .filter(i => !i.is_income && ['paid', 'partial'].includes(i.status))
      .reduce((sum, i) => sum + i.paid_amount, 0);

    const totalOutstanding = updatedInvoices
      .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.remaining_amount, 0);

    console.log(`Total Income: ${totalIncome.toLocaleString('vi-VN')} ₫`);
    console.log(`Total Expense: ${totalExpense.toLocaleString('vi-VN')} ₫`);
    console.log(`Total Outstanding: ${totalOutstanding.toLocaleString('vi-VN')} ₫`);
    console.log(`Net Profit: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} ₫`);

    console.log('\n🎉 Invoice calculations fixed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixInvoiceCalculations();
