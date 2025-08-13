-- Create clock_records table for employee time tracking
CREATE TABLE IF NOT EXISTS clock_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    date DATE NOT NULL,
    total_hours DECIMAL(4,2),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create requests table for employee requests (leave, permission, etc.)
CREATE TABLE IF NOT EXISTS employee_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('leave', 'permission', 'sick', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clock_records_employee_id ON clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_clock_records_date ON clock_records(date);
CREATE INDEX IF NOT EXISTS idx_clock_records_status ON clock_records(status);

CREATE INDEX IF NOT EXISTS idx_employee_requests_employee_id ON employee_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_start_date ON employee_requests(start_date);

-- Add RLS policies for clock_records
ALTER TABLE clock_records ENABLE ROW LEVEL SECURITY;

-- Employees can view and manage their own clock records
CREATE POLICY "Employees can view own clock records" ON clock_records
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = clock_records.employee_id
        )
    );

CREATE POLICY "Employees can insert own clock records" ON clock_records
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = clock_records.employee_id
        )
    );

CREATE POLICY "Employees can update own clock records" ON clock_records
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = clock_records.employee_id
        )
    );

-- Admins can view all clock records
CREATE POLICY "Admins can view all clock records" ON clock_records
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' = 'admin'
        )
    );

-- Add RLS policies for employee_requests
ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view and manage their own requests
CREATE POLICY "Employees can view own requests" ON employee_requests
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = employee_requests.employee_id
        )
    );

CREATE POLICY "Employees can insert own requests" ON employee_requests
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = employee_requests.employee_id
        )
    );

CREATE POLICY "Employees can update own pending requests" ON employee_requests
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = employee_requests.employee_id
        ) AND status = 'pending'
    );

-- Admins can view and manage all requests
CREATE POLICY "Admins can view all requests" ON employee_requests
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' = 'admin'
        )
    );

-- Managers can approve/reject requests
CREATE POLICY "Managers can approve requests" ON employee_requests
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' IN ('admin', 'manager')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clock_records_updated_at 
    BEFORE UPDATE ON clock_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_requests_updated_at 
    BEFORE UPDATE ON employee_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE clock_records IS 'Employee time tracking records for clock in/out functionality';
COMMENT ON TABLE employee_requests IS 'Employee requests for leave, permissions, etc.';

COMMENT ON COLUMN clock_records.employee_id IS 'Reference to the employee who clocked in/out';
COMMENT ON COLUMN clock_records.clock_in IS 'Timestamp when employee clocked in';
COMMENT ON COLUMN clock_records.clock_out IS 'Timestamp when employee clocked out (null if still active)';
COMMENT ON COLUMN clock_records.date IS 'Date of the work day';
COMMENT ON COLUMN clock_records.total_hours IS 'Total hours worked (calculated when clocking out)';
COMMENT ON COLUMN clock_records.status IS 'Status: active (still working) or completed (clocked out)';

COMMENT ON COLUMN employee_requests.type IS 'Type of request: leave, permission, sick, other';
COMMENT ON COLUMN employee_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN employee_requests.approved_by IS 'Employee ID who approved the request';
COMMENT ON COLUMN employee_requests.data IS 'Additional request data in JSON format';
