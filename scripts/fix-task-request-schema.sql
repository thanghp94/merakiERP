-- Fix Task and Request System Database Schema Issues
-- This script aligns the database schema with the API expectations

-- =====================================================
-- FIX TASKS TABLE SCHEMA
-- =====================================================

-- The current tasks table in schema.sql has different column names than what the API expects
-- API expects: class_id, assigned_by, due_date, status, task_type
-- Current schema has: assigned_to, due_date, status (these exist)
-- Missing: class_id, assigned_by, task_type

-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'homework' CHECK (task_type IN ('homework', 'assignment', 'project', 'exam', 'other'));

-- Update existing tasks to have default values
UPDATE tasks SET task_type = 'homework' WHERE task_type IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tasks_class_id ON tasks(class_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- =====================================================
-- ENSURE HR REQUEST SYSTEM TABLES EXIST
-- =====================================================

-- Create requests table if it doesn't exist (from create-hr-request-system.sql)
CREATE TABLE IF NOT EXISTS requests (
    request_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('nghi_phep', 'doi_lich', 'tam_ung', 'mua_sam_sua_chua')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
    created_by_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    approver_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create request_comments table if it doesn't exist
-- Note: We need to create this AFTER the requests table is confirmed to exist
-- and we need to reference the correct primary key column
CREATE TABLE IF NOT EXISTS request_comments (
    comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after ensuring requests table exists
-- This will be added later in the script after we verify the requests table structure

-- Create employee_requests table (alternative system that the API also expects)
CREATE TABLE IF NOT EXISTS employee_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('leave', 'permission', 'sick', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for requests table
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_approver ON requests(approver_employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_data ON requests USING GIN (request_data);

-- Indexes for request_comments
CREATE INDEX IF NOT EXISTS idx_request_comments_request ON request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_employee ON request_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_created_at ON request_comments(created_at);

-- Indexes for employee_requests
CREATE INDEX IF NOT EXISTS idx_employee_requests_employee ON employee_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_type ON employee_requests(type);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_start_date ON employee_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_employee_requests_data ON employee_requests USING GIN (data);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for requests table
CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for employee_requests table
CREATE TRIGGER update_employee_requests_updated_at 
    BEFORE UPDATE ON employee_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample employees if none exist
INSERT INTO employees (full_name, email, phone, position, status, data)
SELECT 
    'Test Employee for API Testing',
    'test-employee@example.com',
    '0123456789',
    'Teacher',
    'active',
    '{"role": "teacher", "department": "Education"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'test-employee@example.com');

-- Insert sample class if none exist
INSERT INTO classes (class_name, status, start_date, data)
SELECT 
    'Test Class for API Testing',
    'active',
    CURRENT_DATE,
    '{"level": "beginner", "capacity": 20}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_name = 'Test Class for API Testing');

-- Get sample employee and class IDs for testing
DO $$
DECLARE
    sample_employee_id UUID;
    sample_class_id UUID;
BEGIN
    -- Get sample employee ID
    SELECT id INTO sample_employee_id 
    FROM employees 
    WHERE email = 'test-employee@example.com'
    LIMIT 1;
    
    -- Get sample class ID
    SELECT id INTO sample_class_id 
    FROM classes 
    WHERE class_name = 'Test Class for API Testing'
    LIMIT 1;
    
    -- Insert sample task
    IF sample_employee_id IS NOT NULL AND sample_class_id IS NOT NULL THEN
        INSERT INTO tasks (
            title, 
            description, 
            class_id, 
            assigned_by, 
            due_date, 
            task_type, 
            status, 
            data
        ) VALUES (
            'Sample Task for API Testing',
            'This is a sample task created for API testing purposes',
            sample_class_id,
            sample_employee_id,
            CURRENT_DATE + INTERVAL '7 days',
            'homework',
            'active',
            '{"priority": "medium", "estimated_hours": 2}'::jsonb
        ) ON CONFLICT DO NOTHING;
        
        -- Insert sample request
        INSERT INTO requests (
            request_type,
            title,
            description,
            request_data,
            created_by_employee_id
        ) VALUES (
            'nghi_phep',
            'Sample Leave Request for API Testing',
            'This is a sample leave request for API testing',
            '{"from_date": "2024-12-25", "to_date": "2024-12-27", "reason": "Personal leave for testing"}'::jsonb,
            sample_employee_id
        ) ON CONFLICT DO NOTHING;
        
        -- Insert sample employee request
        INSERT INTO employee_requests (
            employee_id,
            type,
            title,
            description,
            start_date,
            end_date,
            data
        ) VALUES (
            sample_employee_id,
            'leave',
            'Sample Employee Request for API Testing',
            'This is a sample employee request for API testing',
            CURRENT_DATE + INTERVAL '5 days',
            CURRENT_DATE + INTERVAL '7 days',
            '{"reason": "Personal leave for API testing"}'::jsonb
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample data created successfully';
    ELSE
        RAISE NOTICE 'Could not create sample data - missing employee or class';
    END IF;
END $$;

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINTS AFTER TABLE CREATION
-- =====================================================

-- Add foreign key constraint for request_comments to requests table
-- This is done after table creation to avoid the "column does not exist" error
DO $$
BEGIN
    -- Check if the foreign key constraint doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'request_comments_request_id_fkey'
        AND table_name = 'request_comments'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE request_comments 
        ADD CONSTRAINT request_comments_request_id_fkey 
        FOREIGN KEY (request_id) REFERENCES requests(request_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for request_comments.request_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for request_comments.request_id already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON request_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_requests TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tasks table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- Verify requests table exists
SELECT COUNT(*) as requests_count FROM requests;

-- Verify employee_requests table exists
SELECT COUNT(*) as employee_requests_count FROM employee_requests;

-- Show sample data
SELECT 'Tasks' as table_name, COUNT(*) as count FROM tasks
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM requests
UNION ALL
SELECT 'Employee Requests' as table_name, COUNT(*) as count FROM employee_requests;
