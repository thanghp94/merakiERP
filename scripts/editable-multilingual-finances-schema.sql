-- Enhanced Finances Schema with Editable Multilingual Categories
-- Perfect for Vietnamese/English education center

-- 1. Create finance_categories table with multilingual support
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- Internal code like 'tuition_fee'
    name_en VARCHAR(100) NOT NULL,    -- English name
    name_vi VARCHAR(100) NOT NULL,    -- Vietnamese name
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description_en TEXT,              -- English description
    description_vi TEXT,              -- Vietnamese description
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create payment_methods table with multilingual support
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name_en VARCHAR(50) NOT NULL,
    name_vi VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update finances table structure
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Keep the old category and transaction_type as VARCHAR for backward compatibility
ALTER TABLE finances ALTER COLUMN transaction_type TYPE VARCHAR(50);

-- 4. Create finance_items table for multiple items per transaction
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

-- 5. Create payment_schedules table for installment tracking
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

-- 6. Insert default finance categories (Income)
INSERT INTO finance_categories (code, name_en, name_vi, type, description_en, description_vi, sort_order) VALUES
('tuition_fee', 'Tuition Fee', 'Học phí', 'income', 'Student tuition payments', 'Thanh toán học phí của học sinh', 1),
('registration_fee', 'Registration Fee', 'Phí đăng ký', 'income', 'New student registration fees', 'Phí đăng ký học sinh mới', 2),
('material_fee', 'Material Fee', 'Phí tài liệu', 'income', 'Books and learning materials', 'Sách và tài liệu học tập', 3),
('exam_fee', 'Exam Fee', 'Phí thi', 'income', 'Examination and certification fees', 'Phí thi và chứng chỉ', 4),
('private_lesson_fee', 'Private Lesson Fee', 'Phí học riêng', 'income', 'One-on-one tutoring fees', 'Phí dạy kèm một-một', 5),
('summer_course_fee', 'Summer Course Fee', 'Phí khóa hè', 'income', 'Summer intensive course fees', 'Phí khóa học hè chuyên sâu', 6),
('late_fee', 'Late Fee', 'Phí trễ hạn', 'income', 'Late payment penalties', 'Phí phạt thanh toán trễ', 7),
('other_income', 'Other Income', 'Thu nhập khác', 'income', 'Miscellaneous income', 'Thu nhập linh tinh', 99),

-- Insert default finance categories (Expenses)
('staff_salary', 'Staff Salary', 'Lương nhân viên', 'expense', 'Employee salary payments', 'Thanh toán lương nhân viên', 1),
('teacher_bonus', 'Teacher Bonus', 'Thưởng giáo viên', 'expense', 'Performance bonuses for teachers', 'Thưởng hiệu suất cho giáo viên', 2),
('facility_rent', 'Facility Rent', 'Tiền thuê mặt bằng', 'expense', 'Building and room rental costs', 'Chi phí thuê tòa nhà và phòng học', 3),
('utilities', 'Utilities', 'Tiện ích', 'expense', 'Electricity, water, internet bills', 'Hóa đơn điện, nước, internet', 4),
('equipment', 'Equipment', 'Thiết bị', 'expense', 'Teaching equipment and technology', 'Thiết bị giảng dạy và công nghệ', 5),
('marketing', 'Marketing', 'Marketing', 'expense', 'Advertising and promotional costs', 'Chi phí quảng cáo và khuyến mãi', 6),
('maintenance', 'Maintenance', 'Bảo trì', 'expense', 'Facility and equipment maintenance', 'Bảo trì cơ sở vật chất và thiết bị', 7),
('office_supplies', 'Office Supplies', 'Văn phòng phẩm', 'expense', 'Stationery and office materials', 'Văn phòng phẩm và vật liệu văn phòng', 8),
('transportation', 'Transportation', 'Giao thông', 'expense', 'Travel and transportation costs', 'Chi phí đi lại và giao thông', 9),
('insurance', 'Insurance', 'Bảo hiểm', 'expense', 'Insurance premiums', 'Phí bảo hiểm', 10),
('training', 'Training', 'Đào tạo', 'expense', 'Staff training and development', 'Đào tạo và phát triển nhân viên', 11),
('other_expense', 'Other Expense', 'Chi phí khác', 'expense', 'Miscellaneous expenses', 'Chi phí linh tinh', 99)
ON CONFLICT (code) DO NOTHING;

-- 7. Insert default payment methods
INSERT INTO payment_methods (code, name_en, name_vi, sort_order) VALUES
('cash', 'Cash', 'Tiền mặt', 1),
('bank_transfer', 'Bank Transfer', 'Chuyển khoản', 2),
('credit_card', 'Credit Card', 'Thẻ tín dụng', 3),
('debit_card', 'Debit Card', 'Thẻ ghi nợ', 4),
('online_payment', 'Online Payment', 'Thanh toán online', 5),
('mobile_payment', 'Mobile Payment', 'Thanh toán di động', 6),
('check', 'Check', 'Séc', 7)
ON CONFLICT (code) DO NOTHING;

-- 8. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finances_facility ON finances(facility_id);
CREATE INDEX IF NOT EXISTS idx_finances_employee ON finances(employee_id);
CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category_id);
CREATE INDEX IF NOT EXISTS idx_finances_payment_method ON finances(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_finances_is_income ON finances(is_income);
CREATE INDEX IF NOT EXISTS idx_finances_due_date ON finances(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_categories_type ON finance_categories(type);
CREATE INDEX IF NOT EXISTS idx_finance_categories_active ON finance_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_items_finance ON finance_items(finance_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_student ON payment_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_class ON payment_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_finance_items_data ON finance_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_data ON payment_schedules USING GIN (data);

-- 9. Create triggers for updated_at
CREATE TRIGGER update_finance_categories_updated_at BEFORE UPDATE ON finance_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create comprehensive view for financial reporting with multilingual support
CREATE OR REPLACE VIEW finance_summary AS
SELECT 
    f.id,
    f.transaction_date,
    f.amount,
    f.transaction_type,
    f.is_income,
    f.reference_number,
    f.description,
    f.notes,
    f.status,
    f.due_date,
    s.full_name as student_name,
    e.full_name as employee_name,
    fac.name as facility_name,
    fc.code as category_code,
    fc.name_en as category_name_en,
    fc.name_vi as category_name_vi,
    fc.type as category_type,
    pm.code as payment_method_code,
    pm.name_en as payment_method_name_en,
    pm.name_vi as payment_method_name_vi,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'item_name', fi.item_name,
                'item_description', fi.item_description,
                'quantity', fi.quantity,
                'unit_price', fi.unit_price,
                'total_amount', fi.total_amount
            )
        ) FROM finance_items fi WHERE fi.finance_id = f.id),
        '[]'::json
    ) as items,
    f.created_at
FROM finances f
LEFT JOIN students s ON f.student_id = s.id
LEFT JOIN employees e ON f.employee_id = e.id
LEFT JOIN facilities fac ON f.facility_id = fac.id
LEFT JOIN finance_categories fc ON f.category_id = fc.id
LEFT JOIN payment_methods pm ON f.payment_method_id = pm.id;

-- 11. Function to calculate payment schedule status
CREATE OR REPLACE FUNCTION update_payment_schedule_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount = NEW.total_amount - NEW.paid_amount;
    
    IF NEW.remaining_amount <= 0 THEN
        NEW.status = 'completed';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partial';
    ELSIF NEW.due_date < CURRENT_DATE THEN
        NEW.status = 'overdue';
    ELSE
        NEW.status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_schedule_status_trigger
    BEFORE INSERT OR UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_payment_schedule_status();

-- 12. Helper functions for multilingual support
CREATE OR REPLACE FUNCTION get_finance_categories(lang VARCHAR DEFAULT 'vi')
RETURNS TABLE(
    id UUID,
    code VARCHAR,
    name VARCHAR,
    type VARCHAR,
    description TEXT,
    is_active BOOLEAN,
    sort_order INTEGER
) AS $$
BEGIN
    IF lang = 'en' THEN
        RETURN QUERY
        SELECT fc.id, fc.code, fc.name_en as name, fc.type, fc.description_en as description, fc.is_active, fc.sort_order
        FROM finance_categories fc
        WHERE fc.is_active = true
        ORDER BY fc.type, fc.sort_order, fc.name_en;
    ELSE
        RETURN QUERY
        SELECT fc.id, fc.code, fc.name_vi as name, fc.type, fc.description_vi as description, fc.is_active, fc.sort_order
        FROM finance_categories fc
        WHERE fc.is_active = true
        ORDER BY fc.type, fc.sort_order, fc.name_vi;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_payment_methods(lang VARCHAR DEFAULT 'vi')
RETURNS TABLE(
    id UUID,
    code VARCHAR,
    name VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    IF lang = 'en' THEN
        RETURN QUERY
        SELECT pm.id, pm.code, pm.name_en as name, pm.is_active
        FROM payment_methods pm
        WHERE pm.is_active = true
        ORDER BY pm.sort_order, pm.name_en;
    ELSE
        RETURN QUERY
        SELECT pm.id, pm.code, pm.name_vi as name, pm.is_active
        FROM payment_methods pm
        WHERE pm.is_active = true
        ORDER BY pm.sort_order, pm.name_vi;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_finance_categories(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_methods(VARCHAR) TO authenticated;
