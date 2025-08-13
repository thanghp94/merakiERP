-- Invoice-Based Finance System Integration
-- Tích hợp với schema hiện tại: students, employees, facilities, classes

-- Step 1: Create invoices table (Bảng hóa đơn chính)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL, -- Số hóa đơn (auto-generated)
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Liên kết với các bảng hiện tại
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Thông tin chung
  is_income BOOLEAN NOT NULL DEFAULT false, -- Thu (true) hay Chi (false)
  payment_method TEXT NOT NULL DEFAULT 'cash', -- Phương thức thanh toán
  reference_number TEXT, -- Mã tham chiếu
  
  -- Tổng tiền
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0, -- Tổng tiền trước thuế/giảm giá
  tax_rate DECIMAL(5,2) DEFAULT 0, -- Tỷ lệ thuế (%)
  tax_amount DECIMAL(15,2) DEFAULT 0, -- Tiền thuế
  discount_rate DECIMAL(5,2) DEFAULT 0, -- Tỷ lệ giảm giá (%)
  discount_amount DECIMAL(15,2) DEFAULT 0, -- Tiền giảm giá
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- Tổng tiền cuối cùng
  
  -- Trạng thái
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'overdue')),
  
  -- Ghi chú
  description TEXT, -- Mô tả chung hóa đơn
  notes TEXT, -- Ghi chú nội bộ
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create invoice_items table (Bảng chi tiết hóa đơn)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Thông tin sản phẩm/dịch vụ
  item_name TEXT NOT NULL, -- Tên mục (VD: Học phí tháng 1, Lương giáo viên)
  item_description TEXT DEFAULT '', -- Mô tả chi tiết
  category TEXT NOT NULL, -- Danh mục
  
  -- Số lượng và giá
  quantity DECIMAL(10,2) DEFAULT 1, -- Số lượng
  unit_price DECIMAL(15,2) NOT NULL, -- Đơn giá
  total_amount DECIMAL(15,2) NOT NULL, -- Thành tiền (quantity * unit_price)
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Modify existing finances table to link with invoices
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing finances records
UPDATE finances 
SET is_income = CASE 
  WHEN transaction_type IN ('payment', 'fee') THEN true 
  ELSE false 
END
WHERE is_income IS NULL;

-- Step 4: Create payment_schedules table (Lịch thanh toán trả góp)
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Thông tin thanh toán
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Trạng thái
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_employee_id ON invoices(employee_id);
CREATE INDEX IF NOT EXISTS idx_invoices_facility_id ON invoices(facility_id);
CREATE INDEX IF NOT EXISTS idx_invoices_class_id ON invoices(class_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_is_income ON invoices(is_income);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_category ON invoice_items(category);

CREATE INDEX IF NOT EXISTS idx_finances_invoice_id ON finances(invoice_id);
CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category);
CREATE INDEX IF NOT EXISTS idx_finances_is_income ON finances(is_income);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_student_id ON payment_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_class_id ON payment_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_invoice_id ON payment_schedules(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

-- Step 6: Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^INV-' || current_year || current_month || '-[0-9]+$')
            THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || current_year || current_month || '-') + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM invoices;
    
    invoice_num := 'INV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Step 9: Create function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal DECIMAL(15,2);
    invoice_tax DECIMAL(15,2);
    invoice_discount DECIMAL(15,2);
    invoice_total DECIMAL(15,2);
    invoice_record RECORD;
BEGIN
    -- Get the invoice_id (works for both INSERT and DELETE)
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO invoice_record FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
    END IF;
    
    -- Calculate subtotal from all items
    SELECT COALESCE(SUM(total_amount), 0) 
    INTO invoice_subtotal
    FROM invoice_items 
    WHERE invoice_id = invoice_record.id;
    
    -- Calculate tax and discount
    invoice_tax := invoice_subtotal * (invoice_record.tax_rate / 100);
    invoice_discount := invoice_subtotal * (invoice_record.discount_rate / 100);
    invoice_total := invoice_subtotal + invoice_tax - invoice_discount;
    
    -- Update invoice totals
    UPDATE invoices 
    SET 
        subtotal = invoice_subtotal,
        tax_amount = invoice_tax,
        discount_amount = invoice_discount,
        total_amount = invoice_total,
        updated_at = NOW()
    WHERE id = invoice_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic total calculation
CREATE TRIGGER trigger_update_invoice_totals_insert
    AFTER INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_update
    AFTER UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_delete
    AFTER DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

-- Step 10: Create helper functions for categories and payment methods
CREATE OR REPLACE FUNCTION get_finance_category_labels()
RETURNS TABLE(value TEXT, label_en TEXT, label_vi TEXT) AS $$
BEGIN
  RETURN QUERY VALUES
    -- Thu nhập (Income)
    ('tuition_fee', 'Tuition Fee', 'Học phí'),
    ('registration_fee', 'Registration Fee', 'Phí đăng ký'),
    ('material_fee', 'Material Fee', 'Phí tài liệu'),
    ('exam_fee', 'Exam Fee', 'Phí thi'),
    ('private_lesson_fee', 'Private Lesson Fee', 'Phí học riêng'),
    ('summer_course_fee', 'Summer Course Fee', 'Phí khóa hè'),
    ('late_fee', 'Late Fee', 'Phí trễ hạn'),
    ('other_income', 'Other Income', 'Thu nhập khác'),
    
    -- Chi phí (Expenses)
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

-- Step 11: Grant permissions
GRANT EXECUTE ON FUNCTION get_finance_category_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;

-- Step 12: Create sample data function
CREATE OR REPLACE FUNCTION create_sample_invoice_data()
RETURNS VOID AS $$
DECLARE
    sample_student_id UUID;
    sample_employee_id UUID;
    sample_class_id UUID;
    sample_invoice_id UUID;
BEGIN
    -- Get sample IDs
    SELECT id INTO sample_student_id FROM students LIMIT 1;
    SELECT id INTO sample_employee_id FROM employees LIMIT 1;
    SELECT id INTO sample_class_id FROM classes LIMIT 1;
    
    -- Create sample income invoice (học phí)
    INSERT INTO invoices (
        student_id, 
        class_id,
        is_income, 
        payment_method, 
        description,
        status
    ) VALUES (
        sample_student_id,
        sample_class_id,
        true,
        'bank_transfer',
        'Học phí tháng 1/2024',
        'completed'
    ) RETURNING id INTO sample_invoice_id;
    
    -- Add items to the invoice
    INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
    (sample_invoice_id, 'Học phí GrapeSEED Unit 1', 'tuition_fee', 1, 2000000, 2000000),
    (sample_invoice_id, 'Phí tài liệu', 'material_fee', 1, 200000, 200000);
    
    -- Create sample expense invoice (lương)
    INSERT INTO invoices (
        employee_id,
        is_income, 
        payment_method, 
        description,
        status
    ) VALUES (
        sample_employee_id,
        false,
        'bank_transfer',
        'Lương tháng 1/2024',
        'completed'
    ) RETURNING id INTO sample_invoice_id;
    
    -- Add salary item
    INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
    (sample_invoice_id, 'Lương cơ bản', 'staff_salary', 1, 15000000, 15000000);
    
    RAISE NOTICE 'Sample invoice data created successfully!';
END;
$$ LANGUAGE plpgsql;
