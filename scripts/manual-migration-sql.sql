-- Manual Migration SQL for Finance System
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add missing columns to existing finances table
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

-- Step 2: Create finance_items table
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

-- Step 3: Create payment_schedules table
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

-- Step 4: Create helper functions for getting category and payment method labels
CREATE OR REPLACE FUNCTION get_finance_category_labels()
RETURNS TABLE(value TEXT, label_en TEXT, label_vi TEXT) AS $$
BEGIN
  RETURN QUERY VALUES
    ('tuition_fee', 'Tuition Fee', 'Học phí'),
    ('registration_fee', 'Registration Fee', 'Phí đăng ký'),
    ('material_fee', 'Material Fee', 'Phí tài liệu'),
    ('exam_fee', 'Exam Fee', 'Phí thi'),
    ('private_lesson_fee', 'Private Lesson Fee', 'Phí học riêng'),
    ('summer_course_fee', 'Summer Course Fee', 'Phí khóa hè'),
    ('late_fee', 'Late Fee', 'Phí trễ hạn'),
    ('other_income', 'Other Income', 'Thu nhập khác'),
    ('staff_salary', 'Staff Salary', 'Lương nhân viên'),
    ('teacher_bonus', 'Teacher Bonus', 'Thưởng giáo viên'),
    ('facility_rent', 'Facility Rent', 'Tiền thuê mặt bằng'),
    ('utilities', 'Utilities', 'Tiện ích'),
    ('equipment', 'Equipment', 'Thiết bị'),
    ('marketing', 'Marketing', 'Marketing'),
    ('maintenance', 'Maintenance', 'Bảo trì'),
    ('office_supplies', 'Office Supplies', 'Văn phòng phẩm'),
    ('transportation', 'Transportation', 'Giao thông'),
    ('insurance', 'Insurance', 'Bảo hiểm'),
    ('training', 'Training', 'Đào tạo'),
    ('other_expense', 'Other Expense', 'Chi phí khác');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_payment_method_labels()
RETURNS TABLE(value TEXT, label_en TEXT, label_vi TEXT) AS $$
BEGIN
  RETURN QUERY VALUES
    ('cash', 'Cash', 'Tiền mặt'),
    ('bank_transfer', 'Bank Transfer', 'Chuyển khoản'),
    ('credit_card', 'Credit Card', 'Thẻ tín dụng'),
    ('debit_card', 'Debit Card', 'Thẻ ghi nợ'),
    ('online_payment', 'Online Payment', 'Thanh toán online'),
    ('mobile_payment', 'Mobile Payment', 'Thanh toán di động'),
    ('check', 'Check', 'Séc');
END;
$$ LANGUAGE plpgsql;
