-- Add insurance_base column to payroll_records table
-- This column stores the social insurance salary amount used for Vietnamese social insurance calculations

ALTER TABLE payroll_records
ADD COLUMN IF NOT EXISTS insurance_base DECIMAL(15,2);

-- Add comment to the column
COMMENT ON COLUMN payroll_records.insurance_base IS 'Social insurance salary amount used for Vietnamese social insurance calculations (BHXH, BHYT, BHTN)';

-- Add index for performance if needed
CREATE INDEX IF NOT EXISTS idx_payroll_records_insurance_base ON payroll_records(insurance_base);

-- Update existing records to set insurance_base = base_salary if null
-- This ensures backward compatibility
UPDATE payroll_records
SET insurance_base = base_salary
WHERE insurance_base IS NULL AND base_salary IS NOT NULL;
