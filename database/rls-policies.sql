-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user ID from JWT
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'sub')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is TA
CREATE OR REPLACE FUNCTION is_ta()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'teacher', 'ta');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STUDENTS TABLE POLICIES
-- =====================================================

-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (
    get_user_role() = 'student' AND 
    id::text = get_user_id()::text
  );

-- Teachers and admins can view all students
CREATE POLICY "Teachers and admins can view all students" ON students
  FOR SELECT USING (is_teacher());

-- Only admins can insert/update/delete students
CREATE POLICY "Only admins can manage students" ON students
  FOR ALL USING (is_admin());

-- =====================================================
-- EMPLOYEES TABLE POLICIES
-- =====================================================

-- Employees can view their own data
CREATE POLICY "Employees can view own data" ON employees
  FOR SELECT USING (
    id::text = get_user_id()::text
  );

-- Teachers and admins can view all employees
CREATE POLICY "Teachers and admins can view all employees" ON employees
  FOR SELECT USING (is_teacher());

-- Only admins can manage employees
CREATE POLICY "Only admins can manage employees" ON employees
  FOR ALL USING (is_admin());

-- =====================================================
-- CLASSES TABLE POLICIES
-- =====================================================

-- Everyone can view classes (for enrollment purposes)
CREATE POLICY "Everyone can view classes" ON classes
  FOR SELECT USING (true);

-- Only teachers and admins can manage classes
CREATE POLICY "Teachers and admins can manage classes" ON classes
  FOR ALL USING (is_teacher());

-- =====================================================
-- ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
  FOR SELECT USING (
    get_user_role() = 'student' AND 
    student_id::text = get_user_id()::text
  );

-- Teachers and admins can view all enrollments
CREATE POLICY "Teachers and admins can view all enrollments" ON enrollments
  FOR SELECT USING (is_teacher());

-- Only admins can manage enrollments
CREATE POLICY "Only admins can manage enrollments" ON enrollments
  FOR ALL USING (is_admin());

-- =====================================================
-- FACILITIES TABLE POLICIES
-- =====================================================

-- Everyone can view facilities
CREATE POLICY "Everyone can view facilities" ON facilities
  FOR SELECT USING (true);

-- Only admins can manage facilities
CREATE POLICY "Only admins can manage facilities" ON facilities
  FOR ALL USING (is_admin());

-- =====================================================
-- SESSIONS TABLE POLICIES
-- =====================================================

-- Students can view sessions for classes they're enrolled in
CREATE POLICY "Students can view enrolled sessions" ON sessions
  FOR SELECT USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN main_sessions ms ON ms.class_id = e.class_id
      WHERE e.student_id::text = get_user_id()::text
      AND ms.id = sessions.main_session_id
      AND e.status = 'active'
    )
  );

-- Teachers can view sessions they're assigned to
CREATE POLICY "Teachers can view assigned sessions" ON sessions
  FOR SELECT USING (
    get_user_role() = 'teacher' AND
    teacher_id::text = get_user_id()::text
  );

-- TAs can view sessions they're assigned to
CREATE POLICY "TAs can view assigned sessions" ON sessions
  FOR SELECT USING (
    get_user_role() = 'ta' AND
    teaching_assistant_id::text = get_user_id()::text
  );

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON sessions
  FOR SELECT USING (is_admin());

-- Teachers can manage sessions they're assigned to
CREATE POLICY "Teachers can manage assigned sessions" ON sessions
  FOR ALL USING (
    is_teacher() AND
    (teacher_id::text = get_user_id()::text OR is_admin())
  );

-- =====================================================
-- MAIN_SESSIONS TABLE POLICIES
-- =====================================================

-- Students can view main sessions for classes they're enrolled in
CREATE POLICY "Students can view enrolled main sessions" ON main_sessions
  FOR SELECT USING (
    get_user_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id::text = get_user_id()::text
      AND e.class_id = main_sessions.class_id
      AND e.status = 'active'
    )
  );

-- Teachers and TAs can view all main sessions
CREATE POLICY "Teachers and TAs can view all main sessions" ON main_sessions
  FOR SELECT USING (is_ta());

-- Only teachers and admins can manage main sessions
CREATE POLICY "Teachers and admins can manage main sessions" ON main_sessions
  FOR ALL USING (is_teacher());

-- =====================================================
-- ATTENDANCE TABLE POLICIES
-- =====================================================

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (
    get_user_role() = 'student' AND
    student_id::text = get_user_id()::text
  );

-- Teachers can view attendance for sessions they teach
CREATE POLICY "Teachers can view session attendance" ON attendance
  FOR SELECT USING (
    is_ta() AND
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.main_session_id = attendance.main_session_id
      AND (
        s.teacher_id::text = get_user_id()::text OR
        s.teaching_assistant_id::text = get_user_id()::text OR
        is_admin()
      )
    )
  );

-- Teachers and TAs can manage attendance for their sessions
CREATE POLICY "Teachers and TAs can manage session attendance" ON attendance
  FOR ALL USING (
    is_ta() AND
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.main_session_id = attendance.main_session_id
      AND (
        s.teacher_id::text = get_user_id()::text OR
        s.teaching_assistant_id::text = get_user_id()::text OR
        is_admin()
      )
    )
  );

-- =====================================================
-- FINANCES TABLE POLICIES
-- =====================================================

-- Students can view their own financial records
CREATE POLICY "Students can view own finances" ON finances
  FOR SELECT USING (
    get_user_role() = 'student' AND
    student_id::text = get_user_id()::text
  );

-- Teachers and admins can view all financial records
CREATE POLICY "Teachers and admins can view all finances" ON finances
  FOR SELECT USING (is_teacher());

-- Only admins can manage financial records
CREATE POLICY "Only admins can manage finances" ON finances
  FOR ALL USING (is_admin());

-- =====================================================
-- TASKS TABLE POLICIES
-- =====================================================

-- Users can view tasks assigned to them
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    assigned_to::text = get_user_id()::text OR
    created_by::text = get_user_id()::text OR
    is_admin()
  );

-- Teachers and admins can create tasks
CREATE POLICY "Teachers and admins can create tasks" ON tasks
  FOR INSERT WITH CHECK (is_teacher());

-- Users can update tasks assigned to them or created by them
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (
    assigned_to::text = get_user_id()::text OR
    created_by::text = get_user_id()::text OR
    is_admin()
  );

-- Only admins and task creators can delete tasks
CREATE POLICY "Admins and creators can delete tasks" ON tasks
  FOR DELETE USING (
    created_by::text = get_user_id()::text OR
    is_admin()
  );

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for login/signup)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON students, employees, classes, facilities TO anon;
