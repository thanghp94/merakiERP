-- Optimized Invoice-Finance System
-- Giữ bảng finances như một bridge table cho thanh toán

-- Step 1: Create invoices table (Hóa đơn chính)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Liên kết
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Thông tin hóa đơn
  is_income BOOLEAN NOT NULL DEFAULT false,
  invoice_type TEXT NOT NULL DEFAULT 'standard', -- standard, recurring, adjustment
  
  -- Tổng tiền
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Trạng thái hóa đơn
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Thông tin thanh toán
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Mô tả
  description TEXT,
  notes TEXT,
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create invoice_items table (Chi tiết hóa đơn)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Thông tin item
  item_name TEXT NOT NULL,
  item_description TEXT DEFAULT '',
  category TEXT NOT NULL,
  
  -- Số lượng và giá
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Modify existing finances table to work with invoices
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing data
UPDATE finances 
SET is_income = CASE 
  WHEN transaction_type IN ('payment', 'fee') THEN true 
  ELSE false 
END
WHERE is_income IS NULL;

-- Step 4: Create function to auto-generate invoice numbers
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

-- Step 5: Create triggers for invoice number and totals
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

-- Step 6: Function to update invoice totals and payment status
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_subtotal DECIMAL(15,2);
    invoice_tax DECIMAL(15,2);
    invoice_total DECIMAL(15,2);
    invoice_paid DECIMAL(15,2);
    invoice_remaining DECIMAL(15,2);
    invoice_record RECORD;
    new_status TEXT;
BEGIN
    -- Get invoice_id
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO invoice_record FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
    END IF;
    
    -- Calculate subtotal from items
    SELECT COALESCE(SUM(total_amount), 0) 
    INTO invoice_subtotal
    FROM invoice_items 
    WHERE invoice_id = invoice_record.id;
    
    -- Calculate tax and total
    invoice_tax := invoice_subtotal * (invoice_record.tax_rate / 100);
    invoice_total := invoice_subtotal + invoice_tax - invoice_record.discount_amount;
    
    -- Calculate paid amount from finances
    SELECT COALESCE(SUM(amount), 0)
    INTO invoice_paid
    FROM finances 
    WHERE invoice_id = invoice_record.id AND status = 'completed';
    
    invoice_remaining := invoice_total - invoice_paid;
    
    -- Determine status
    IF invoice_paid = 0 THEN
        new_status := CASE 
            WHEN invoice_record.due_date < CURRENT_DATE THEN 'overdue'
            WHEN invoice_record.status = 'draft' THEN 'draft'
            ELSE 'sent'
        END;
    ELSIF invoice_paid >= invoice_total THEN
        new_status := 'paid';
    ELSE
        new_status := 'partial';
    END IF;
    
    -- Update invoice
    UPDATE invoices 
    SET 
        subtotal = invoice_subtotal,
        tax_amount = invoice_tax,
        total_amount = invoice_total,
        paid_amount = invoice_paid,
        remaining_amount = invoice_remaining,
        status = new_status,
        updated_at = NOW()
    WHERE id = invoice_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_invoice_totals_items_insert
    AFTER INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_items_update
    AFTER UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_items_delete
    AFTER DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_finances_insert
    AFTER INSERT ON finances
    FOR EACH ROW
    WHEN (NEW.invoice_id IS NOT NULL)
    EXECUTE FUNCTION update_invoice_totals();

CREATE TRIGGER trigger_update_invoice_totals_finances_update
    AFTER UPDATE ON finances
    FOR EACH ROW
    WHEN (NEW.invoice_id IS NOT NULL OR OLD.invoice_id IS NOT NULL)
    EXECUTE FUNCTION update_invoice_totals();

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_employee_id ON invoices(employee_id);
CREATE INDEX IF NOT EXISTS idx_invoices_facility_id ON invoices(facility_id);
CREATE INDEX IF NOT EXISTS idx_invoices_class_id ON invoices(class_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_category ON invoice_items(category);

CREATE INDEX IF NOT EXISTS idx_finances_invoice_id ON finances(invoice_id);

-- Step 8: Create updated_at triggers
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Helper functions
CREATE OR REPLACE FUNCTION get_finance_category_labels()
RETURNS TABLE(value TEXT, label_en TEXT, label_vi TEXT) AS $$
BEGIN
  RETURN QUERY VALUES
    -- Thu nhập
    ('tuition_fee', 'Tuition Fee', 'Học phí'),
    ('registration_fee', 'Registration Fee', 'Phí đăng ký'),
    ('material_fee', 'Material Fee', 'Phí tài liệu'),
    ('exam_fee', 'Exam Fee', 'Phí thi'),
    ('private_lesson_fee', 'Private Lesson Fee', 'Phí học riêng'),
    ('other_income', 'Other Income', 'Thu nhập khác'),
    
    -- Chi phí
    ('staff_salary', 'Staff Salary', 'Lương nhân viên'),
    ('teacher_bonus', 'Teacher Bonus', 'Thưởng giáo viên'),
    ('facility_rent', 'Facility Rent', 'Tiền thuê mặt bằng'),
    ('utilities', 'Utilities', 'Tiện ích'),
    ('equipment', 'Equipment', 'Thiết bị'),
    ('marketing', 'Marketing', 'Marketing'),
    ('office_supplies', 'Office Supplies', 'Văn phòng phẩm'),
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
    ('online_payment', 'Online Payment', 'Thanh toán online'),
    ('mobile_payment', 'Mobile Payment', 'Thanh toán di động');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_finance_category_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_method_labels() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
