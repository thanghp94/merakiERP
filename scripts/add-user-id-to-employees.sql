-- Phase 1: Add user_id column to employees table for user-employee mapping
-- This script implements the recommended solution from USER_EMPLOYEE_MAPPING_PLAN.md

BEGIN;

-- 1. Add user_id column to employees table
ALTER TABLE public.employees 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. Create unique index to ensure one employee per user
CREATE UNIQUE INDEX idx_employees_user_id ON public.employees(user_id) 
WHERE user_id IS NOT NULL;

-- 3. Add index for faster lookups
CREATE INDEX idx_employees_user_id_lookup ON public.employees(user_id) 
WHERE user_id IS NOT NULL;

-- Enable pg_trgm extension if not already enabled (for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Add index for email lookups (fallback method) - using btree for exact matches
CREATE INDEX idx_employees_email ON public.employees 
USING btree ((data->>'email')) 
WHERE data->>'email' IS NOT NULL;

-- 5. Create helper function to get employee by user_id
CREATE OR REPLACE FUNCTION get_employee_by_user_id(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  emp_position text,
  department text,
  status text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e."position"::text, e.department::text, 
         e.status, e.data, e.created_at, e.updated_at, e.user_id
  FROM public.employees e
  WHERE e.user_id = p_user_id AND e.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create helper function to find employee by email (fallback)
CREATE OR REPLACE FUNCTION get_employee_by_email(p_email text)
RETURNS TABLE(
  id uuid,
  full_name text,
  emp_position text,
  department text,
  status text,
  data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e."position"::text, e.department::text, 
         e.status, e.data, e.created_at, e.updated_at, e.user_id
  FROM public.employees e
  WHERE LOWER(e.data->>'email') = LOWER(p_email) 
    AND e.status = 'active'
    AND e.user_id IS NULL; -- Only return unlinked employees
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add RLS policy for users to view their own employee record
CREATE POLICY "Users can view own employee record" ON public.employees
FOR SELECT USING (user_id = auth.uid());

-- 8. Add RLS policy for users to update their own employee record (limited fields)
CREATE POLICY "Users can update own employee data" ON public.employees
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 9. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

COMMIT;

-- Display summary
SELECT 'User-Employee mapping schema update completed successfully!' as status;
SELECT 'Next steps:' as next_steps;
SELECT '1. Run the data migration script to link existing users to employees' as step_1;
SELECT '2. Create the /api/employees/current endpoint' as step_2;
SELECT '3. Update frontend components to use the new mapping' as step_3;
