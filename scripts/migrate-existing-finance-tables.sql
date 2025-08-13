-- Migration Script: Xử lý các bảng finance hiện tại
-- Chuyển đổi sang hệ thống invoice-based mới

-- Step 1: Kiểm tra các bảng hiện tại
DO $$
BEGIN
    RAISE NOTICE 'Checking existing finance tables...';
    
    -- Kiểm tra bảng finances hiện tại
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finances') THEN
        RAISE NOTICE 'Found existing finances table';
    END IF;
    
    -- Kiểm tra các bảng có thể đã tạo trước đó
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_items') THEN
        RAISE NOTICE 'Found existing finance_items table - will be renamed';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_schedules') THEN
        RAISE NOTICE 'Found existing payment_schedules table - will be preserved';
    END IF;
END $$;

-- Step 2: Backup dữ liệu hiện tại (tạo bảng backup)
CREATE TABLE IF NOT EXISTS finances_backup AS 
SELECT * FROM finances WHERE 1=0; -- Tạo cấu trúc trống

-- Backup dữ liệu nếu có
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM finances LIMIT 1) THEN
        INSERT INTO finances_backup SELECT * FROM finances;
        RAISE NOTICE 'Backed up % records from finances table', (SELECT COUNT(*) FROM finances);
    END IF;
END $$;

-- Step 3: Xử lý bảng finance_items cũ (nếu có)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_items') THEN
        -- Rename bảng cũ để tránh conflict
        ALTER TABLE finance_items RENAME TO finance_items_old;
        RAISE NOTICE 'Renamed old finance_items table to finance_items_old';
    END IF;
END $$;

-- Step 4: Chạy schema mới (từ optimized-invoice-finance-schema.sql)
-- Tạo bảng invoices
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
  invoice_type TEXT NOT NULL DEFAULT 'standard',
  
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

-- Tạo bảng invoice_items mới
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

-- Step 5: Cập nhật bảng finances hiện tại
ALTER TABLE finances 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Cập nhật dữ liệu hiện tại
UPDATE finances 
SET is_income = CASE 
  WHEN transaction_type IN ('payment', 'fee') THEN true 
  ELSE false 
END
WHERE is_income IS NULL;

-- Check if category column is ENUM type and handle accordingly
DO $$
BEGIN
    -- Try to update category with ENUM casting
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finances' 
        AND column_name = 'category' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Category is ENUM, cast the values
        UPDATE finances 
        SET category = CASE 
          WHEN transaction_type = 'payment' THEN 'tuition_fee'::finance_category_enum
          WHEN transaction_type = 'fee' THEN 'registration_fee'::finance_category_enum
          WHEN transaction_type = 'refund' THEN 'other_income'::finance_category_enum
          ELSE 'other_expense'::finance_category_enum
        END
        WHERE category IS NULL;
    ELSE
        -- Category is TEXT, update normally
        UPDATE finances 
        SET category = CASE 
          WHEN transaction_type = 'payment' THEN 'tuition_fee'
          WHEN transaction_type = 'fee' THEN 'registration_fee'
          WHEN transaction_type = 'refund' THEN 'other_income'
          ELSE 'other_expense'
        END
        WHERE category IS NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, just skip the category update
        RAISE NOTICE 'Skipping category update due to type mismatch: %', SQLERRM;
END $$;

-- Step 6: Migrate dữ liệu từ finance_items_old (nếu có)
DO $$
DECLARE
    old_item RECORD;
    new_invoice_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_items_old') THEN
        RAISE NOTICE 'Migrating data from finance_items_old...';
        
        -- Tạo invoices từ finance_items_old (group by finance_id)
        FOR old_item IN 
            SELECT 
                finance_id,
                MIN(created_at) as invoice_date,
                SUM(total_amount) as total_amount,
                STRING_AGG(item_name, ', ') as description
            FROM finance_items_old 
            GROUP BY finance_id
        LOOP
            -- Tạo invoice mới
            INSERT INTO invoices (
                description,
                total_amount,
                subtotal,
                invoice_date,
                is_income,
                status
            ) VALUES (
                old_item.description,
                old_item.total_amount,
                old_item.total_amount,
                old_item.invoice_date,
                true, -- Giả sử là thu nhập
                'completed'
            ) RETURNING id INTO new_invoice_id;
            
            -- Migrate items
            INSERT INTO invoice_items (
                invoice_id,
                item_name,
                item_description,
                category,
                quantity,
                unit_price,
                total_amount
            )
            SELECT 
                new_invoice_id,
                item_name,
                COALESCE(item_description, ''),
                COALESCE(category, 'other_income'),
                quantity,
                unit_price,
                total_amount
            FROM finance_items_old 
            WHERE finance_id = old_item.finance_id;
            
            -- Link finance record to invoice
            UPDATE finances 
            SET invoice_id = new_invoice_id 
            WHERE id = old_item.finance_id;
        END LOOP;
        
        RAISE NOTICE 'Migration from finance_items_old completed';
    END IF;
END $$;

-- Step 7: Tạo indexes
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

-- Step 8: Tạo functions và triggers
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

-- Step 9: Function để update totals
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

-- Tạo triggers
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

-- Step 10: Tạo updated_at triggers
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Drop existing functions if they exist, then recreate
DROP FUNCTION IF EXISTS get_finance_category_labels();
DROP FUNCTION IF EXISTS get_payment_method_labels();

-- Helper functions
CREATE FUNCTION get_finance_category_labels()
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

CREATE FUNCTION get_payment_method_labels()
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

-- Step 12: Tạo sample data function
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
    
    IF sample_student_id IS NOT NULL THEN
        -- Tạo sample invoice cho học sinh
        INSERT INTO invoices (
            student_id, 
            class_id,
            is_income, 
            description,
            status
        ) VALUES (
            sample_student_id,
            sample_class_id,
            true,
            'Học phí tháng 1/2024',
            'completed'
        ) RETURNING id INTO sample_invoice_id;
        
        -- Add items
        INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
        (sample_invoice_id, 'Học phí GrapeSEED Unit 1', 'tuition_fee', 1, 2000000, 2000000),
        (sample_invoice_id, 'Phí tài liệu', 'material_fee', 1, 200000, 200000);
    END IF;
    
    IF sample_employee_id IS NOT NULL THEN
        -- Tạo sample invoice cho nhân viên
        INSERT INTO invoices (
            employee_id,
            is_income, 
            description,
            status
        ) VALUES (
            sample_employee_id,
            false,
            'Lương tháng 1/2024',
            'completed'
        ) RETURNING id INTO sample_invoice_id;
        
        -- Add salary item
        INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
        (sample_invoice_id, 'Lương cơ bản', 'staff_salary', 1, 15000000, 15000000);
    END IF;
    
    RAISE NOTICE 'Sample invoice data created successfully!';
END;
$$ LANGUAGE plpgsql;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '- invoices (hóa đơn chính)';
    RAISE NOTICE '- invoice_items (chi tiết hóa đơn)';
    RAISE NOTICE 'Updated tables:';
    RAISE NOTICE '- finances (linked to invoices)';
    RAISE NOTICE 'Backup tables:';
    RAISE NOTICE '- finances_backup (backup of original data)';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance_items_old') THEN
        RAISE NOTICE '- finance_items_old (renamed from finance_items)';
    END IF;
    RAISE NOTICE 'Payment_schedules table preserved if exists';
    RAISE NOTICE '=== READY TO USE ===';
END $$;
