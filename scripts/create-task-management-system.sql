-- =====================================================
-- HỆ THỐNG QUẢN LÝ CÔNG VIỆC CHO TRUNG TÂM TIẾNG ANH
-- Task Management System for English Center
-- Sử dụng bảng employees hiện có
-- =====================================================

-- Bảng: công việc (tasks) - mẫu công việc và công việc tùy chỉnh
CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT CHECK (task_type IN ('repeated', 'custom')) NOT NULL,
    frequency JSONB,      -- {"repeat":"weekly","days":["Thứ Hai","Thứ Năm"]}
    meta_data JSONB,      -- thuộc tính động: danh mục, lớp học, phụ huynh, học sinh liên quan
    created_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chỉ mục JSONB cho truy vấn frequency và metadata
CREATE INDEX IF NOT EXISTS idx_tasks_frequency_gin ON tasks USING GIN (frequency);
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_gin ON tasks USING GIN (meta_data);

-- Bảng: phiên bản công việc (task_instances) - các lần thực hiện cụ thể
CREATE TABLE IF NOT EXISTS task_instances (
    task_instance_id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(task_id) ON DELETE CASCADE,
    assigned_to_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    due_date TIMESTAMP NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed', 'overdue')) DEFAULT 'pending',
    completion_data JSONB, -- ghi chú, tệp đính kèm, bình luận
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chỉ mục JSONB cho completion_data
CREATE INDEX IF NOT EXISTS idx_instances_completion_gin ON task_instances USING GIN (completion_data);

-- Chỉ mục cho truy vấn thường dùng
CREATE INDEX IF NOT EXISTS idx_task_instances_due_date ON task_instances (due_date);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances (status);
CREATE INDEX IF NOT EXISTS idx_task_instances_assigned_to ON task_instances (assigned_to_employee_id);

-- Bảng: bình luận công việc (task_comments)
CREATE TABLE IF NOT EXISTS task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_instance_id INT REFERENCES task_instances(task_instance_id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DỮ LIỆU MẪU (SAMPLE DATA)
-- Sử dụng employees hiện có từ hệ thống
-- =====================================================

-- Lấy ID của một số nhân viên hiện có để tạo dữ liệu mẫu
-- (Giả sử đã có nhân viên trong bảng employees)

-- Công việc lặp lại: Chuẩn bị giáo án lớp A (hàng tuần, Thứ 2 & Thứ 5)
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Chuẩn bị giáo án lớp GrapeSEED A1',
    'Chuẩn bị bài tập và hoạt động hàng tuần cho lớp GrapeSEED A1',
    'repeated',
    '{"repeat":"weekly","days":["Thứ Hai","Thứ Năm"]}'::jsonb,
    '{"category":"giảng_dạy","class_id":1,"class_name":"GrapeSEED A1","priority":"cao","estimated_hours":2}'::jsonb,
    e.id
FROM employees e 
WHERE e.position IN ('Giáo viên', 'Trợ giảng') OR e.data->>'position' IN ('Giáo viên', 'Trợ giảng')
LIMIT 1;

-- Công việc tùy chỉnh: Gọi điện cho phụ huynh
INSERT INTO tasks (title, description, task_type, meta_data, created_by_employee_id)
SELECT 
    'Gọi điện phụ huynh về tình hình học tập',
    'Liên hệ với phụ huynh em Nguyễn Minh Khôi về việc vắng học liên tục',
    'custom',
    '{"category":"liên_hệ_phụ_huynh","student_name":"Nguyễn Minh Khôi","parent_phone":"0987654321","urgency":"cao","reason":"vắng_học"}'::jsonb,
    e.id
FROM employees e 
WHERE e.position IN ('Giáo viên', 'Trợ giảng') OR e.data->>'position' IN ('Giáo viên', 'Trợ giảng')
LIMIT 1;

-- Công việc HR: Chuẩn bị bảng lương hàng tháng
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Chuẩn bị bảng lương tháng',
    'Tổng hợp và kiểm tra hồ sơ lương cho toàn bộ nhân viên',
    'repeated',
    '{"repeat":"monthly","day_of_month":25}'::jsonb,
    '{"category":"nhân_sự","department":"all","estimated_hours":4}'::jsonb,
    e.id
FROM employees e 
WHERE e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Hành chính nhân sự'
LIMIT 1;

-- Công việc quản lý: Họp đánh giá chất lượng giảng dạy
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Họp đánh giá chất lượng giảng dạy',
    'Họp hàng tuần với các giáo viên để đánh giá và cải thiện chất lượng giảng dạy',
    'repeated',
    '{"repeat":"weekly","days":["Thứ Sáu"]}'::jsonb,
    '{"category":"quản_lý","meeting_type":"chất_lượng","attendees":["giáo viên"],"estimated_hours":1.5}'::jsonb,
    e.id
FROM employees e 
WHERE e.position IN ('Quản lý', 'Phó giám đốc', 'Giám đốc', 'Tổ trưởng') OR e.data->>'position' IN ('Quản lý', 'Phó giám đốc', 'Giám đốc', 'Tổ trưởng') OR e.data->>'department' = 'Ban giám đốc'
LIMIT 1;

-- Công việc marketing: Chuẩn bị tài liệu tuyển sinh
INSERT INTO tasks (title, description, task_type, meta_data, created_by_employee_id)
SELECT 
    'Cập nhật tài liệu tuyển sinh',
    'Chuẩn bị và cập nhật brochure, poster cho đợt tuyển sinh mới',
    'custom',
    '{"category":"marketing","materials":["brochure","poster","flyer"],"deadline":"2024-02-15","priority":"trung_bình"}'::jsonb,
    e.id
FROM employees e 
WHERE e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Chăm sóc khách hàng'
LIMIT 1;

-- Công việc giáo viên: Chấm bài kiểm tra
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Chấm bài kiểm tra Unit 6',
    'Chấm và nhập điểm bài kiểm tra Unit 6 cho các lớp GrapeSEED',
    'repeated',
    '{"repeat":"weekly","days":["Chủ Nhật"]}'::jsonb,
    '{"category":"đánh_giá","unit":"Unit 6","classes":["GrapeSEED A1","GrapeSEED A2"],"estimated_hours":3}'::jsonb,
    e.id
FROM employees e 
WHERE e.position IN ('Giáo viên', 'Trợ giảng') OR e.data->>'position' IN ('Giáo viên', 'Trợ giảng')
LIMIT 1;

-- Công việc hành chính: Cập nhật hồ sơ học sinh
INSERT INTO tasks (title, description, task_type, meta_data, created_by_employee_id)
SELECT 
    'Cập nhật hồ sơ học sinh mới',
    'Nhập thông tin và tạo hồ sơ cho học sinh mới nhập học tháng này',
    'custom',
    '{"category":"hành_chính","new_students_count":15,"deadline":"2024-01-31","priority":"cao"}'::jsonb,
    e.id
FROM employees e 
WHERE e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Hành chính nhân sự'
LIMIT 1;

-- Công việc kế toán: Đối soát thu chi
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Đối soát thu chi hàng tháng',
    'Kiểm tra và đối soát các khoản thu chi trong tháng',
    'repeated',
    '{"repeat":"monthly","day_of_month":30}'::jsonb,
    '{"category":"kế_toán","includes":["học_phí","lương","chi_phí_vận_hành"],"estimated_hours":6}'::jsonb,
    e.id
FROM employees e 
WHERE e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Tài chính'
LIMIT 1;

-- Công việc vận hành: Kiểm tra an ninh cơ sở
INSERT INTO tasks (title, description, task_type, frequency, meta_data, created_by_employee_id)
SELECT 
    'Kiểm tra an ninh cơ sở',
    'Kiểm tra hệ thống an ninh, khóa cửa, camera giám sát',
    'repeated',
    '{"repeat":"daily","time":"18:00"}'::jsonb,
    '{"category":"an_ninh","checklist":["khóa_cửa","camera","đèn_chiếu_sáng","báo_động"],"estimated_minutes":30}'::jsonb,
    e.id
FROM employees e 
WHERE e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Vận hành'
LIMIT 1;

-- Thêm một số task instances mẫu cho tuần này
INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status, completion_data)
SELECT 
    t.task_id,
    t.created_by_employee_id,
    CURRENT_DATE + INTERVAL '1 day',
    'pending',
    '{"notes":"Cần chuẩn bị trước 8h sáng"}'::jsonb
FROM tasks t 
WHERE t.title LIKE '%giáo án%'
LIMIT 1;

INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status, completion_data)
SELECT 
    t.task_id,
    t.created_by_employee_id,
    CURRENT_DATE + INTERVAL '2 days',
    'pending',
    '{"priority":"urgent","contact_attempts":0}'::jsonb
FROM tasks t 
WHERE t.title LIKE '%phụ huynh%'
LIMIT 1;

-- Thêm một số comments mẫu
INSERT INTO task_comments (task_instance_id, employee_id, comment)
SELECT 
    ti.task_instance_id,
    ti.assigned_to_employee_id,
    'Đã liên hệ với phụ huynh lần đầu, sẽ gọi lại vào chiều mai.'
FROM task_instances ti
JOIN tasks t ON ti.task_id = t.task_id
WHERE t.title LIKE '%phụ huynh%'
LIMIT 1;
