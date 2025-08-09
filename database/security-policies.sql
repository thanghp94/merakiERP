-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for development)
-- Note: In production, you should create more restrictive policies

-- Students table policies
CREATE POLICY "Allow public read access on students" ON students
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on students" ON students
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on students" ON students
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on students" ON students
    FOR DELETE USING (true);

-- Facilities table policies
CREATE POLICY "Allow public read access on facilities" ON facilities
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on facilities" ON facilities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on facilities" ON facilities
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on facilities" ON facilities
    FOR DELETE USING (true);

-- Employees table policies
CREATE POLICY "Allow public read access on employees" ON employees
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on employees" ON employees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on employees" ON employees
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on employees" ON employees
    FOR DELETE USING (true);

-- Classes table policies
CREATE POLICY "Allow public read access on classes" ON classes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on classes" ON classes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on classes" ON classes
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on classes" ON classes
    FOR DELETE USING (true);

-- Teaching sessions table policies
CREATE POLICY "Allow public read access on teaching_sessions" ON teaching_sessions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on teaching_sessions" ON teaching_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on teaching_sessions" ON teaching_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on teaching_sessions" ON teaching_sessions
    FOR DELETE USING (true);

-- Enrollments table policies
CREATE POLICY "Allow public read access on enrollments" ON enrollments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on enrollments" ON enrollments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on enrollments" ON enrollments
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on enrollments" ON enrollments
    FOR DELETE USING (true);

-- Attendance table policies
CREATE POLICY "Allow public read access on attendance" ON attendance
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on attendance" ON attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on attendance" ON attendance
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on attendance" ON attendance
    FOR DELETE USING (true);

-- Finances table policies
CREATE POLICY "Allow public read access on finances" ON finances
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on finances" ON finances
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on finances" ON finances
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on finances" ON finances
    FOR DELETE USING (true);

-- Tasks table policies
CREATE POLICY "Allow public read access on tasks" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on tasks" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on tasks" ON tasks
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on tasks" ON tasks
    FOR DELETE USING (true);

-- Assets table policies
CREATE POLICY "Allow public read access on assets" ON assets
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on assets" ON assets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on assets" ON assets
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on assets" ON assets
    FOR DELETE USING (true);

-- Payroll table policies
CREATE POLICY "Allow public read access on payroll" ON payroll
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on payroll" ON payroll
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on payroll" ON payroll
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on payroll" ON payroll
    FOR DELETE USING (true);

-- Admissions table policies
CREATE POLICY "Allow public read access on admissions" ON admissions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on admissions" ON admissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on admissions" ON admissions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on admissions" ON admissions
    FOR DELETE USING (true);

-- Evaluations table policies
CREATE POLICY "Allow public read access on evaluations" ON evaluations
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on evaluations" ON evaluations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on evaluations" ON evaluations
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on evaluations" ON evaluations
    FOR DELETE USING (true);

-- Student assignments table policies
CREATE POLICY "Allow public read access on student_assignments" ON student_assignments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on student_assignments" ON student_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on student_assignments" ON student_assignments
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on student_assignments" ON student_assignments
    FOR DELETE USING (true);

-- IMPORTANT SECURITY NOTES:
-- 1. These policies allow public access for development purposes
-- 2. In production, you should implement proper authentication and authorization
-- 3. Consider using auth.uid() to restrict access to authenticated users
-- 4. Implement role-based access control (RBAC) for different user types
-- 5. Use more granular policies based on your business requirements

-- Example of more secure policies (commented out):
/*
-- Only allow authenticated users to read students
CREATE POLICY "Authenticated users can read students" ON students
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow specific roles to insert students
CREATE POLICY "Admin can insert students" ON students
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'staff'
    );
*/
