-- Simple ENUM-based Finance Schema (Fixed Version)
-- Categories are fixed, multilingual handled in frontend

-- 1. Create ENUM types for categories and payment methods
DO $$ BEGIN
    CREATE TYPE finance_category_enum AS ENUM (
        -- Income Categories
        'tuition_fee',
        'registration_fee', 
        'material_fee',
        'exam_fee',
        'private_lesson_fee',
        'summer_course_fee',
        'late_fee',
        'other_income',
        
        -- Expense Categories
        'staff_salary',
        'teacher_bonus',
        'facility_rent',
        'utilities',
        'equipment',
        'marketing',
        'maintenance',
        'office_supplies',
        'transportation',
        'insurance',
        'training',
        'other_expense'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'cash',
        'bank_transfer',
        'credit_card',
        'debit_card',
        'online_payment',
        'mobile_payment',
        'check'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add new columns to existing finances table (keeping it simple)
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS category finance_category_enum,
ADD COLUMN IF NOT EXISTS payment_method payment_method_enum DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create finance_items table for multiple items per transaction
CREATE TABLE IF NOT EXISTS finance_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    finance_id UUID REFERENCES finances(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create payment_schedules table for installment tracking
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category);
CREATE INDEX IF NOT EXISTS idx_finances_payment_method ON finances(payment_method);
CREATE INDEX IF NOT EXISTS idx_finances_is_income ON finances(is_income);
CREATE INDEX IF NOT EXISTS idx_finances_due_date ON finances(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_items_finance ON finance_items(finance_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_student ON payment_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);

-- 6. Create the updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $trigger$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$trigger$ language 'plpgsql';

-- 7. Create triggers
DROP TRIGGER IF EXISTS update_payment_schedules_updated_at ON payment_schedules;
CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Helper function to get category labels (for API)
CREATE OR REPLACE FUNCTION get_finance_category_labels()
RETURNS TABLE(
    value TEXT,
    label_en TEXT,
    label_vi TEXT,
    type TEXT
) AS $func$
BEGIN
    RETURN QUERY VALUES
    -- Income categories
    ('tuition_fee'::TEXT, 'Tuition Fee'::TEXT, 'Học phí'::TEXT, 'income'::TEXT),
    ('registration_fee'::TEXT, 'Registration Fee'::TEXT, 'Phí đăng ký'::TEXT, 'income'::TEXT),
    ('material_fee'::TEXT, 'Material Fee'::TEXT, 'Phí tài liệu'::TEXT, 'income'::TEXT),
    ('exam_fee'::TEXT, 'Exam Fee'::TEXT, 'Phí thi'::TEXT, 'income'::TEXT),
    ('private_lesson_fee'::TEXT, 'Private Lesson Fee'::TEXT, 'Phí học riêng'::TEXT, 'income'::TEXT),
    ('summer_course_fee'::TEXT, 'Summer Course Fee'::TEXT, 'Phí khóa hè'::TEXT, 'income'::TEXT),
    ('late_fee'::TEXT, 'Late Fee'::TEXT, 'Phí trễ hạn'::TEXT, 'income'::TEXT),
    ('other_income'::TEXT, 'Other Income'::TEXT, 'Thu nhập khác'::TEXT, 'income'::TEXT),
    
    -- Expense categories
    ('staff_salary'::TEXT, 'Staff Salary'::TEXT, 'Lương nhân viên'::TEXT, 'expense'::TEXT),
    ('teacher_bonus'::TEXT, 'Teacher Bonus'::TEXT, 'Thưởng giáo viên'::TEXT, 'expense'::TEXT),
    ('facility_rent'::TEXT, 'Facility Rent'::TEXT, 'Tiền thuê mặt bằng'::TEXT, 'expense'::TEXT),
    ('utilities'::TEXT, 'Utilities'::TEXT, 'Tiện ích'::TEXT, 'expense'::TEXT),
    ('equipment'::TEXT, 'Equipment'::TEXT, 'Thiết bị'::TEXT, 'expense'::TEXT),
    ('marketing'::TEXT, 'Marketing'::TEXT, 'Marketing'::TEXT, 'expense'::TEXT),
    ('maintenance'::TEXT, 'Maintenance'::TEXT, 'Bảo trì'::TEXT, 'expense'::TEXT),
    ('office_supplies'::TEXT, 'Office Supplies'::TEXT, 'Văn phòng phẩm'::TEXT, 'expense'::TEXT),
    ('transportation'::TEXT, 'Transportation'::TEXT, 'Giao thông'::TEXT, 'expense'::TEXT),
    ('insurance'::TEXT, 'Insurance'::TEXT, 'Bảo hiểm'::TEXT, 'expense'::TEXT),
    ('training'::TEXT, 'Training'::TEXT, 'Đào tạo'::TEXT, 'expense'::TEXT),
    ('other_expense'::TEXT, 'Other Expense'::TEXT, 'Chi phí khác'::TEXT, 'expense'::TEXT);
END;
$func$ LANGUAGE plpgsql;

-- 9. Helper function to get payment method labels
CREATE OR REPLACE FUNCTION get_payment_method_labels()
RETURNS TABLE(
    value TEXT,
    label_en TEXT,
    label_vi TEXT
) AS $func2$
BEGIN
    RETURN QUERY VALUES
    ('cash'::TEXT, 'Cash'::TEXT, 'Tiền mặt'::TEXT),
    ('bank_transfer'::TEXT, 'Bank Transfer'::TEXT, 'Chuyển khoản'::TEXT),
    ('credit_card'::TEXT, 'Credit Card'::TEXT, 'Thẻ tín dụng'::TEXT),
    ('debit_card'::TEXT, 'Debit Card'::TEXT, 'Thẻ ghi nợ'::TEXT),
    ('online_payment'::TEXT, 'Online Payment'::TEXT, 'Thanh toán online'::TEXT),
    ('mobile_payment'::TEXT, 'Mobile Payment'::TEXT, 'Thanh toán di động'::TEXT),
    ('check'::TEXT, 'Check'::TEXT, 'Séc'::TEXT);
END;
$func2$ LANGUAGE plpgsql;

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION get_finance_category_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
