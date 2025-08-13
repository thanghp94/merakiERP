-- Vietnamese Payroll System Integration
-- Integrates with existing invoice-based finance system

-- Step 1: Create payroll-specific tables
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_name TEXT NOT NULL, -- "Tháng 01/2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create payroll records (links to invoices)
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL, -- Links to invoice system!
  
  -- Lương cơ bản
  base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  actual_working_days INTEGER DEFAULT 0,
  
  -- Phụ cấp
  allowances JSONB DEFAULT '{}', -- {"transport": 500000, "lunch": 300000, "phone": 200000}
  
  -- Thưởng
  bonuses JSONB DEFAULT '{}', -- {"performance": 1000000, "holiday": 500000}
  
  -- Tổng thu nhập trước thuế
  gross_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Các khoản khấu trừ bắt buộc (Vietnamese specific)
  bhxh_employee DECIMAL(15,2) DEFAULT 0, -- Bảo hiểm xã hội (8%)
  bhyt_employee DECIMAL(15,2) DEFAULT 0, -- Bảo hiểm y tế (1.5%)
  bhtn_employee DECIMAL(15,2) DEFAULT 0, -- Bảo hiểm thất nghiệp (1%)
  
  -- Thuế thu nhập cá nhân
  personal_income_tax DECIMAL(15,2) DEFAULT 0,
  
  -- Các khoản khấu trừ khác
  other_deductions JSONB DEFAULT '{}', -- {"union_fee": 10000, "advance": 500000}
  
  -- Tổng khấu trừ
  total_deductions DECIMAL(15,2) DEFAULT 0,
  
  -- Lương thực lĩnh
  net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Phần công ty đóng (employer contributions)
  bhxh_employer DECIMAL(15,2) DEFAULT 0, -- 17.5%
  bhyt_employer DECIMAL(15,2) DEFAULT 0, -- 3%
  bhtn_employer DECIMAL(15,2) DEFAULT 0, -- 1%
  
  -- Metadata
  notes TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, payroll_period_id)
);

-- Step 3: Create Vietnamese tax brackets table
CREATE TABLE IF NOT EXISTS vn_tax_brackets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  min_income DECIMAL(15,2) NOT NULL,
  max_income DECIMAL(15,2),
  tax_rate DECIMAL(5,2) NOT NULL,
  deduction_amount DECIMAL(15,2) DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  is_active BOOLEAN DEFAULT true
);

-- Insert current Vietnamese tax brackets (2024)
INSERT INTO vn_tax_brackets (min_income, max_income, tax_rate, deduction_amount, year) VALUES
(0, 5000000, 5, 0, 2024),
(5000000, 10000000, 10, 250000, 2024),
(10000000, 18000000, 15, 750000, 2024),
(18000000, 32000000, 20, 1650000, 2024),
(32000000, 52000000, 25, 3250000, 2024),
(52000000, 80000000, 30, 5850000, 2024),
(80000000, NULL, 35, 9850000, 2024)
ON CONFLICT DO NOTHING;

-- Step 4: Create functions for Vietnamese payroll calculations
CREATE OR REPLACE FUNCTION calculate_vietnamese_social_insurance(
  gross_salary DECIMAL(15,2),
  insurance_base DECIMAL(15,2) DEFAULT NULL
) RETURNS TABLE(
  bhxh_employee DECIMAL(15,2),
  bhyt_employee DECIMAL(15,2), 
  bhtn_employee DECIMAL(15,2),
  bhxh_employer DECIMAL(15,2),
  bhyt_employer DECIMAL(15,2),
  bhtn_employer DECIMAL(15,2)
) AS $$
DECLARE
  base_amount DECIMAL(15,2);
  max_bhxh_base DECIMAL(15,2) := 29800000; -- 2024 limit
  min_bhxh_base DECIMAL(15,2) := 4680000;  -- 2024 minimum wage
BEGIN
  -- Use provided insurance base or gross salary
  base_amount := COALESCE(insurance_base, gross_salary);
  
  -- Apply limits
  base_amount := GREATEST(base_amount, min_bhxh_base);
  base_amount := LEAST(base_amount, max_bhxh_base);
  
  RETURN QUERY SELECT
    ROUND(base_amount * 0.08, 0)::DECIMAL(15,2), -- BHXH employee 8%
    ROUND(base_amount * 0.015, 0)::DECIMAL(15,2), -- BHYT employee 1.5%
    ROUND(base_amount * 0.01, 0)::DECIMAL(15,2),  -- BHTN employee 1%
    ROUND(base_amount * 0.175, 0)::DECIMAL(15,2), -- BHXH employer 17.5%
    ROUND(base_amount * 0.03, 0)::DECIMAL(15,2),  -- BHYT employer 3%
    ROUND(base_amount * 0.01, 0)::DECIMAL(15,2);  -- BHTN employer 1%
END;
$$ LANGUAGE plpgsql;

-- Step 5: Function to calculate Vietnamese personal income tax
CREATE OR REPLACE FUNCTION calculate_vietnamese_income_tax(
  taxable_income DECIMAL(15,2),
  dependents INTEGER DEFAULT 0
) RETURNS DECIMAL(15,2) AS $$
DECLARE
  personal_deduction DECIMAL(15,2) := 11000000; -- 2024 rate
  dependent_deduction DECIMAL(15,2) := 4400000; -- per dependent 2024
  net_taxable_income DECIMAL(15,2);
  tax_amount DECIMAL(15,2) := 0;
  bracket RECORD;
BEGIN
  -- Calculate net taxable income after deductions
  net_taxable_income := taxable_income - personal_deduction - (dependents * dependent_deduction);
  
  -- If no taxable income, return 0
  IF net_taxable_income <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate progressive tax
  FOR bracket IN 
    SELECT * FROM vn_tax_brackets 
    WHERE year = EXTRACT(YEAR FROM NOW()) AND is_active = true
    ORDER BY min_income
  LOOP
    IF net_taxable_income > bracket.min_income THEN
      DECLARE
        taxable_in_bracket DECIMAL(15,2);
      BEGIN
        IF bracket.max_income IS NULL THEN
          taxable_in_bracket := net_taxable_income - bracket.min_income;
        ELSE
          taxable_in_bracket := LEAST(net_taxable_income, bracket.max_income) - bracket.min_income;
        END IF;
        
        tax_amount := tax_amount + (taxable_in_bracket * bracket.tax_rate / 100);
      END;
    END IF;
  END LOOP;
  
  RETURN ROUND(tax_amount, 0);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Function to create payroll invoice automatically
CREATE OR REPLACE FUNCTION create_payroll_invoice(
  p_payroll_record_id UUID
) RETURNS UUID AS $$
DECLARE
  payroll_rec RECORD;
  invoice_id UUID;
  invoice_number TEXT;
  period_name TEXT;
BEGIN
  -- Get payroll record details
  SELECT pr.*, pp.period_name, e.full_name, e.employee_code
  INTO payroll_rec
  FROM payroll_records pr
  JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
  JOIN employees e ON pr.employee_id = e.id
  WHERE pr.id = p_payroll_record_id;
  
  -- Generate invoice number
  invoice_number := 'PAYROLL-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                   LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' ||
                   COALESCE(payroll_rec.employee_code, payroll_rec.employee_id::TEXT);
  
  -- Create invoice
  INSERT INTO invoices (
    invoice_number,
    invoice_date,
    employee_id,
    is_income,
    invoice_type,
    total_amount,
    status,
    description,
    data
  ) VALUES (
    invoice_number,
    CURRENT_DATE,
    payroll_rec.employee_id,
    false, -- This is an expense (salary payment)
    'payroll',
    payroll_rec.net_salary,
    'approved',
    'Lương tháng ' || payroll_rec.period_name || ' - ' || payroll_rec.full_name,
    jsonb_build_object(
      'payroll_record_id', p_payroll_record_id,
      'period_name', payroll_rec.period_name,
      'gross_salary', payroll_rec.gross_salary,
      'total_deductions', payroll_rec.total_deductions,
      'net_salary', payroll_rec.net_salary
    )
  ) RETURNING id INTO invoice_id;
  
  -- Create invoice items for salary components
  INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount, data)
  VALUES 
    (invoice_id, 'Lương cơ bản', 'staff_salary', 1, payroll_rec.base_salary, payroll_rec.base_salary, 
     jsonb_build_object('type', 'base_salary')),
    (invoice_id, 'Khấu trừ BHXH', 'staff_salary', 1, -payroll_rec.bhxh_employee, -payroll_rec.bhxh_employee,
     jsonb_build_object('type', 'bhxh_deduction')),
    (invoice_id, 'Khấu trừ BHYT', 'staff_salary', 1, -payroll_rec.bhyt_employee, -payroll_rec.bhyt_employee,
     jsonb_build_object('type', 'bhyt_deduction')),
    (invoice_id, 'Thuế TNCN', 'staff_salary', 1, -payroll_rec.personal_income_tax, -payroll_rec.personal_income_tax,
     jsonb_build_object('type', 'income_tax'));
  
  -- Update payroll record with invoice_id
  UPDATE payroll_records SET invoice_id = invoice_id WHERE id = p_payroll_record_id;
  
  RETURN invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_period ON payroll_records(employee_id, payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_invoice ON payroll_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON payroll_periods(start_date, end_date);

-- Step 8: Add triggers
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_periods_updated_at BEFORE UPDATE ON payroll_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Sample data for testing
INSERT INTO payroll_periods (period_name, start_date, end_date, status) VALUES
('Tháng 01/2024', '2024-01-01', '2024-01-31', 'draft'),
('Tháng 02/2024', '2024-02-01', '2024-02-29', 'draft')
ON CONFLICT DO NOTHING;

COMMIT;

-- Success message
SELECT 'Vietnamese Payroll System created successfully! 
Features:
✅ BHXH, BHYT, BHTN calculations
✅ Progressive income tax calculation  
✅ Automatic invoice generation
✅ Integration with existing finance system
✅ Vietnamese tax brackets (2024)
✅ Employer contribution tracking' as result;
