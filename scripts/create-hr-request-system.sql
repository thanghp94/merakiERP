-- HR Request & Approval System for Vietnamese Education Company
-- Enhanced version of employee_requests with Vietnamese request types and workflow

-- Drop existing employee_requests table if it exists (we'll recreate with enhanced structure)
DROP TABLE IF EXISTS employee_requests CASCADE;

-- Create enhanced requests table with Vietnamese request types
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

-- Create request_comments table for discussions
CREATE TABLE IF NOT EXISTS request_comments (
    comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES requests(request_id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_approver ON requests(approver_employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);

-- GIN index for JSONB queries on request_data
CREATE INDEX IF NOT EXISTS idx_requests_data ON requests USING GIN (request_data);

-- Indexes for request_comments
CREATE INDEX IF NOT EXISTS idx_request_comments_request ON request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_employee ON request_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_created_at ON request_comments(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_requests_updated_at 
    BEFORE UPDATE ON requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests table

-- Employees can view their own requests
CREATE POLICY "Employees can view own requests" ON requests
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = requests.created_by_employee_id
        )
    );

-- Employees can create their own requests
CREATE POLICY "Employees can create own requests" ON requests
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = requests.created_by_employee_id
        )
    );

-- Employees can update their own pending requests
CREATE POLICY "Employees can update own pending requests" ON requests
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees WHERE id = requests.created_by_employee_id
        ) AND status = 'pending'
    );

-- HR/Admins can view all requests
CREATE POLICY "HR and admins can view all requests" ON requests
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' IN ('admin', 'hr', 'manager')
        )
    );

-- HR/Admins can manage all requests
CREATE POLICY "HR and admins can manage all requests" ON requests
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' IN ('admin', 'hr', 'manager')
        )
    );

-- RLS Policies for request_comments table

-- Employees can view comments on their own requests
CREATE POLICY "Employees can view comments on own requests" ON request_comments
    FOR SELECT USING (
        request_id IN (
            SELECT request_id FROM requests 
            WHERE created_by_employee_id::text = auth.uid()::text
        )
    );

-- Employees can add comments to their own requests
CREATE POLICY "Employees can comment on own requests" ON request_comments
    FOR INSERT WITH CHECK (
        request_id IN (
            SELECT request_id FROM requests 
            WHERE created_by_employee_id::text = auth.uid()::text
        )
        AND employee_id::text = auth.uid()::text
    );

-- HR/Admins can view all comments
CREATE POLICY "HR and admins can view all comments" ON request_comments
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' IN ('admin', 'hr', 'manager')
        )
    );

-- HR/Admins can add comments to any request
CREATE POLICY "HR and admins can comment on all requests" ON request_comments
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' IN ('admin', 'hr', 'manager')
        )
    );

-- Insert sample data for testing

-- First, let's get some employee IDs for testing
DO $$
DECLARE
    sample_employee_id UUID;
    hr_employee_id UUID;
    sample_request_id UUID;
BEGIN
    -- Get a sample employee (first active employee)
    SELECT id INTO sample_employee_id 
    FROM employees 
    WHERE status = 'active' 
    LIMIT 1;
    
    -- Get an HR employee (or create one if none exists)
    SELECT id INTO hr_employee_id 
    FROM employees 
    WHERE data->>'role' = 'hr' OR data->>'role' = 'admin'
    LIMIT 1;
    
    -- If we have employees, create sample requests
    IF sample_employee_id IS NOT NULL THEN
        -- Sample leave request (nghỉ phép)
        INSERT INTO requests (
            request_type, 
            title, 
            description, 
            request_data, 
            created_by_employee_id
        ) VALUES (
            'nghi_phep',
            'Xin nghỉ phép thăm gia đình',
            'Tôi xin phép được nghỉ để về thăm gia đình ở quê nhà.',
            '{"from_date": "2024-02-15", "to_date": "2024-02-17", "reason": "Thăm gia đình", "total_days": 3}',
            sample_employee_id
        ) RETURNING request_id INTO sample_request_id;
        
        -- Add a comment to the sample request
        IF sample_request_id IS NOT NULL THEN
            INSERT INTO request_comments (request_id, employee_id, comment)
            VALUES (sample_request_id, sample_employee_id, 'Đây là yêu cầu khẩn cấp, mong được xem xét sớm.');
        END IF;
        
        -- Sample advance payment request (tạm ứng)
        INSERT INTO requests (
            request_type, 
            title, 
            description, 
            request_data, 
            created_by_employee_id
        ) VALUES (
            'tam_ung',
            'Xin tạm ứng lương tháng 2',
            'Tôi cần tạm ứng một phần lương để chi trả các khoản cấp thiết.',
            '{"amount": 5000000, "reason": "Chi phí y tế khẩn cấp", "repayment_plan": "Trừ vào lương tháng 3"}',
            sample_employee_id
        );
        
        -- Sample purchase request (mua sắm)
        INSERT INTO requests (
            request_type, 
            title, 
            description, 
            request_data, 
            created_by_employee_id
        ) VALUES (
            'mua_sam_sua_chua',
            'Mua máy chiếu cho phòng học',
            'Cần mua máy chiếu mới để thay thế máy cũ đã hỏng.',
            '{"item_name": "Máy chiếu Epson EB-X41", "estimated_cost": 8500000, "reason": "Máy cũ đã hỏng không sửa được", "vendor": "Công ty TNHH Thiết bị giáo dục ABC"}',
            sample_employee_id
        );
        
        -- Sample schedule change request (đổi lịch)
        INSERT INTO requests (
            request_type, 
            title, 
            description, 
            request_data, 
            created_by_employee_id
        ) VALUES (
            'doi_lich',
            'Xin đổi lịch dạy tuần sau',
            'Tôi có việc đột xuất cần đổi lịch dạy từ thứ 3 sang thứ 5.',
            '{"original_date": "2024-02-13", "new_date": "2024-02-15", "reason": "Có cuộc họp quan trọng", "class_affected": "Lớp IELTS 6.5 buổi sáng"}',
            sample_employee_id
        );
        
        RAISE NOTICE 'Sample HR requests created successfully';
    ELSE
        RAISE NOTICE 'No employees found - sample data not created';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE requests IS 'HR requests table supporting Vietnamese request types: nghỉ phép, đổi lịch, tạm ứng, mua sắm/sửa chữa';
COMMENT ON TABLE request_comments IS 'Comments and discussions for HR requests';

COMMENT ON COLUMN requests.request_type IS 'Type of request: nghi_phep, doi_lich, tam_ung, mua_sam_sua_chua';
COMMENT ON COLUMN requests.request_data IS 'Type-specific data in JSON format';
COMMENT ON COLUMN requests.status IS 'Request status: pending, approved, rejected, in_progress, completed';
COMMENT ON COLUMN requests.created_by_employee_id IS 'Employee who created the request';
COMMENT ON COLUMN requests.approver_employee_id IS 'Employee who approved/rejected the request';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON requests TO authenticated;
GRANT SELECT, INSERT ON request_comments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
