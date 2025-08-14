-- Create enum types for employee positions and departments

-- Create position enum type
CREATE TYPE position AS ENUM (
    'Giáo viên',
    'Trợ giảng', 
    'Quản lý',
    'Quản trị viên',
    'Lễ tân',
    'Kế toán',
    'Khác'
);

-- Create department enum type  
CREATE TYPE department AS ENUM (
    'Giảng dạy',
    'Quản lý',
    'Hành chính', 
    'Kế toán',
    'Marketing',
    'IT',
    'Khác'
);

-- Update employees table to use enum types
ALTER TABLE employees 
ALTER COLUMN position TYPE position USING position::position;

-- Add department column with enum type
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS department department;

-- Update the get_enum_values function to handle our new enums
-- (The function already exists in schema.sql and should work with these new enum types)
