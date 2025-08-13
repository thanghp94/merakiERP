const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleFinanceData() {
  try {
    console.log('Creating sample finance data...');

    // Get some students and employees for reference
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(5);

    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(3);

    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name')
      .limit(2);

    if (!students?.length || !employees?.length) {
      console.log('No students or employees found. Creating some first...');
      return;
    }

    // Sample finance transactions
    const sampleTransactions = [
      // Income transactions
      {
        student_id: students[0].id,
        amount: 2500000,
        transaction_type: 'payment',
        category: 'tuition_fee',
        payment_method: 'bank_transfer',
        reference_number: 'TF001',
        is_income: true,
        transaction_date: '2024-01-15',
        status: 'completed',
        description: `Học phí tháng 1 - ${students[0].full_name}`,
        notes: 'Thanh toán đầy đủ học phí'
      },
      {
        student_id: students[1].id,
        amount: 500000,
        transaction_type: 'payment',
        category: 'registration_fee',
        payment_method: 'cash',
        reference_number: 'RF001',
        is_income: true,
        transaction_date: '2024-01-10',
        status: 'completed',
        description: `Phí đăng ký - ${students[1].full_name}`,
        notes: 'Học sinh mới đăng ký'
      },
      {
        student_id: students[2].id,
        amount: 300000,
        transaction_type: 'payment',
        category: 'material_fee',
        payment_method: 'online_payment',
        reference_number: 'MF001',
        is_income: true,
        transaction_date: '2024-01-12',
        status: 'completed',
        description: `Phí tài liệu - ${students[2].full_name}`,
        notes: 'Sách và tài liệu học tập'
      },
      {
        student_id: students[3].id,
        amount: 1200000,
        transaction_type: 'payment',
        category: 'private_lesson_fee',
        payment_method: 'bank_transfer',
        reference_number: 'PL001',
        is_income: true,
        transaction_date: '2024-01-20',
        status: 'completed',
        description: `Phí học riêng - ${students[3].full_name}`,
        notes: 'Học riêng 1-1 với giáo viên'
      },

      // Expense transactions
      {
        employee_id: employees[0].id,
        amount: 15000000,
        transaction_type: 'payment',
        category: 'staff_salary',
        payment_method: 'bank_transfer',
        reference_number: 'SAL001',
        is_income: false,
        transaction_date: '2024-01-31',
        status: 'completed',
        description: `Lương tháng 1 - ${employees[0].full_name}`,
        notes: 'Lương cơ bản + phụ cấp'
      },
      {
        employee_id: employees[1].id,
        amount: 12000000,
        transaction_type: 'payment',
        category: 'staff_salary',
        payment_method: 'bank_transfer',
        reference_number: 'SAL002',
        is_income: false,
        transaction_date: '2024-01-31',
        status: 'completed',
        description: `Lương tháng 1 - ${employees[1].full_name}`,
        notes: 'Lương giáo viên'
      },
      {
        facility_id: facilities?.[0]?.id,
        amount: 8000000,
        transaction_type: 'payment',
        category: 'facility_rent',
        payment_method: 'bank_transfer',
        reference_number: 'RENT001',
        is_income: false,
        transaction_date: '2024-01-01',
        status: 'completed',
        description: `Tiền thuê mặt bằng - ${facilities?.[0]?.name || 'Cơ sở chính'}`,
        notes: 'Tiền thuê tháng 1/2024'
      },
      {
        amount: 2500000,
        transaction_type: 'payment',
        category: 'utilities',
        payment_method: 'cash',
        reference_number: 'UTIL001',
        is_income: false,
        transaction_date: '2024-01-05',
        status: 'completed',
        description: 'Hóa đơn điện nước tháng 12/2023',
        notes: 'Điện: 1,800,000 VND, Nước: 700,000 VND'
      },
      {
        amount: 5000000,
        transaction_type: 'payment',
        category: 'equipment',
        payment_method: 'bank_transfer',
        reference_number: 'EQ001',
        is_income: false,
        transaction_date: '2024-01-18',
        status: 'completed',
        description: 'Mua máy chiếu và loa cho phòng học',
        notes: 'Nâng cấp thiết bị giảng dạy'
      },
      {
        amount: 1500000,
        transaction_type: 'payment',
        category: 'marketing',
        payment_method: 'online_payment',
        reference_number: 'MKT001',
        is_income: false,
        transaction_date: '2024-01-25',
        status: 'completed',
        description: 'Quảng cáo Facebook và Google Ads',
        notes: 'Chiến dịch tuyển sinh tháng 2'
      }
    ];

    // Insert finance transactions
    const { data: insertedTransactions, error: transactionError } = await supabase
      .from('finances')
      .insert(sampleTransactions)
      .select();

    if (transactionError) {
      console.error('Error inserting transactions:', transactionError);
      return;
    }

    console.log(`✅ Created ${insertedTransactions.length} finance transactions`);

    // Create finance items for some transactions (multiple items per transaction)
    const financeItems = [
      // Items for tuition fee transaction
      {
        finance_id: insertedTransactions[0].id,
        item_name: 'Học phí cơ bản',
        item_description: 'Học phí tháng 1/2024',
        quantity: 1,
        unit_price: 2000000,
        total_amount: 2000000
      },
      {
        finance_id: insertedTransactions[0].id,
        item_name: 'Phí hoạt động',
        item_description: 'Phí hoạt động ngoại khóa',
        quantity: 1,
        unit_price: 500000,
        total_amount: 500000
      },

      // Items for material fee transaction
      {
        finance_id: insertedTransactions[2].id,
        item_name: 'Sách giáo khoa',
        item_description: 'Bộ sách English Grammar',
        quantity: 2,
        unit_price: 150000,
        total_amount: 300000
      },

      // Items for equipment transaction
      {
        finance_id: insertedTransactions.find(t => t.reference_number === 'EQ001').id,
        item_name: 'Máy chiếu Epson',
        item_description: 'Máy chiếu độ phân giải Full HD',
        quantity: 1,
        unit_price: 3500000,
        total_amount: 3500000
      },
      {
        finance_id: insertedTransactions.find(t => t.reference_number === 'EQ001').id,
        item_name: 'Loa JBL',
        item_description: 'Loa bluetooth cho phòng học',
        quantity: 1,
        unit_price: 1500000,
        total_amount: 1500000
      },

      // Items for utilities transaction
      {
        finance_id: insertedTransactions.find(t => t.reference_number === 'UTIL001').id,
        item_name: 'Tiền điện',
        item_description: 'Hóa đơn điện tháng 12/2023',
        quantity: 1,
        unit_price: 1800000,
        total_amount: 1800000
      },
      {
        finance_id: insertedTransactions.find(t => t.reference_number === 'UTIL001').id,
        item_name: 'Tiền nước',
        item_description: 'Hóa đơn nước tháng 12/2023',
        quantity: 1,
        unit_price: 700000,
        total_amount: 700000
      }
    ];

    const { data: insertedItems, error: itemsError } = await supabase
      .from('finance_items')
      .insert(financeItems)
      .select();

    if (itemsError) {
      console.error('Error inserting finance items:', itemsError);
      return;
    }

    console.log(`✅ Created ${insertedItems.length} finance items`);

    // Create some payment schedules for installment payments
    const paymentSchedules = [
      {
        student_id: students[4]?.id || students[0].id,
        class_id: null, // You can link to a specific class if needed
        total_amount: 5000000,
        paid_amount: 2000000,
        remaining_amount: 3000000,
        due_date: '2024-02-15',
        status: 'partial',
        data: {
          installment_plan: '3 tháng',
          monthly_amount: 1666667
        }
      },
      {
        student_id: students[1].id,
        class_id: null,
        total_amount: 3000000,
        paid_amount: 0,
        remaining_amount: 3000000,
        due_date: '2024-02-01',
        status: 'pending',
        data: {
          installment_plan: '2 tháng',
          monthly_amount: 1500000
        }
      }
    ];

    const { data: insertedSchedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .insert(paymentSchedules)
      .select();

    if (schedulesError) {
      console.error('Error inserting payment schedules:', schedulesError);
      return;
    }

    console.log(`✅ Created ${insertedSchedules.length} payment schedules`);

    console.log('\n🎉 Sample finance data created successfully!');
    console.log('\nSummary:');
    console.log(`- ${insertedTransactions.length} financial transactions`);
    console.log(`- ${insertedItems.length} transaction items`);
    console.log(`- ${insertedSchedules.length} payment schedules`);
    
    // Calculate totals
    const totalIncome = insertedTransactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = insertedTransactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    console.log(`\nFinancial Summary:`);
    console.log(`- Total Income: ${totalIncome.toLocaleString('vi-VN')} VND`);
    console.log(`- Total Expense: ${totalExpense.toLocaleString('vi-VN')} VND`);
    console.log(`- Net Profit: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} VND`);

  } catch (error) {
    console.error('Error creating sample finance data:', error);
  }
}

createSampleFinanceData();
