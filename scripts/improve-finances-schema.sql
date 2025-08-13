-- Enhanced Finances Schema for Education Center
-- Supports multiple items per transaction and comprehensive income/expense tracking

-- 1. Update existing finances table to be more comprehensive
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'online')),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT true;

-- Update transaction_type to be more comprehensive
ALTER TABLE finances DROP CONSTRAINT IF EXISTS finances_transaction_type_check;
ALTER TABLE finances ADD CONSTRAINT finances_transaction_type_check 
CHECK (transaction_type IN ('tuition_fee', 'registration_fee', 'material_fee', 'exam_fee', 'salary', 'rent', 'utilities', 'equipment', 'marketing', 'maintenance', 'refund', 'discount', 'other_income', 'other_expense'));

-- 2. Create finance_items table for multiple items per transaction
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

-- 3. Create finance_categories table for better organization
CREATE TABLE IF NOT EXISTS finance_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO finance_categories (name, type, description) VALUES
-- Income Categories
('Tuition Fees', 'income', 'Student tuition payments'),
('Registration Fees', 'income', 'New student registration fees'),
('Material Fees', 'income', 'Books and learning materials'),
('Exam Fees', 'income', 'Examination and certification fees'),
('Other Income', 'income', 'Miscellaneous income'),

-- Expense Categories
('Staff Salaries', 'expense', 'Employee salary payments'),
('Facility Rent', 'expense', 'Building and room rental costs'),
('Utilities', 'expense', 'Electricity, water, internet bills'),
('Equipment', 'expense', 'Teaching equipment and technology'),
('Marketing', 'expense', 'Advertising and promotional costs'),
('Maintenance', 'expense', 'Facility and equipment maintenance'),
('Office Supplies', 'expense', 'Stationery and office materials'),
('Other Expenses', 'expense', 'Miscellaneous expenses')
ON CONFLICT (name) DO NOTHING;

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

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finances_facility ON finances(facility_id);
CREATE INDEX IF NOT EXISTS idx_finances_employee ON finances(employee_id);
CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category);
CREATE INDEX IF NOT EXISTS idx_finances_is_income ON finances(is_income);
CREATE INDEX IF NOT EXISTS idx_finances_payment_method ON finances(payment_method);
CREATE INDEX IF NOT EXISTS idx_finance_items_finance ON finance_items(finance_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_type ON finance_categories(type);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_student ON payment_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_class ON payment_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_finance_items_data ON finance_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_data ON payment_schedules USING GIN (data);

-- 6. Create triggers for updated_at
CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create view for comprehensive financial reporting
CREATE OR REPLACE VIEW finance_summary AS
SELECT 
    f.id,
    f.transaction_date,
    f.amount,
    f.transaction_type,
    f.is_income,
    f.category,
    f.subcategory,
    f.payment_method,
    f.reference_number,
    f.description,
    f.status,
    s.full_name as student_name,
    e.full_name as employee_name,
    fac.name as facility_name,
    fc.name as category_name,
    fc.type as category_type,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'item_name', fi.item_name,
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
LEFT JOIN finance_categories fc ON f.category = fc.name;

-- 8. Function to calculate payment schedule status
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
