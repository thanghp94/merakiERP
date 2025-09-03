-- Add employee_code column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) UNIQUE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);

-- Create a sequence for employee codes
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START 1;

-- Update existing records with a default employee code if needed
-- This will generate employee codes like EMP001, EMP002, etc.
UPDATE employees
SET employee_code = 'EMP' || LPAD(nextval('employee_code_seq')::TEXT, 3, '0')
WHERE employee_code IS NULL;
