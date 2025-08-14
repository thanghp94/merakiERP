-- =====================================================
-- HÀM TỰ ĐỘNG TẠO TASK INSTANCES CHO HỆ THỐNG CÔNG VIỆC
-- Automatic Task Instance Generator Function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_task_instances()
RETURNS void AS $$
DECLARE
    t RECORD;
    d DATE;
    target_employee_id TEXT;
    day_name TEXT;
    current_month INT;
    current_year INT;
    target_day INT;
BEGIN
    -- Lặp qua tất cả các công việc lặp lại
    FOR t IN 
        SELECT * FROM tasks WHERE task_type = 'repeated'
    LOOP
        -- Xử lý công việc lặp lại hàng tuần
        IF (t.frequency->>'repeat') = 'weekly' THEN
            -- Tạo task instances cho 2 tuần tới
            FOR d IN CURRENT_DATE..(CURRENT_DATE + INTERVAL '14 days') LOOP
                -- Chuyển đổi tên ngày sang tiếng Việt
                day_name := CASE EXTRACT(DOW FROM d)
                    WHEN 0 THEN 'Chủ Nhật'
                    WHEN 1 THEN 'Thứ Hai'
                    WHEN 2 THEN 'Thứ Ba'
                    WHEN 3 THEN 'Thứ Tư'
                    WHEN 4 THEN 'Thứ Năm'
                    WHEN 5 THEN 'Thứ Sáu'
                    WHEN 6 THEN 'Thứ Bảy'
                END;
                
                -- Kiểm tra xem ngày này có trong danh sách không
                IF day_name = ANY (
                    SELECT jsonb_array_elements_text(t.frequency->'days')
                ) THEN
                    -- Tìm nhân viên được giao việc (ưu tiên người tạo task)
                    target_employee_id := t.created_by_employee_id;
                    
                    -- Nếu không có người tạo, tìm nhân viên phù hợp theo category
                    IF target_employee_id IS NULL THEN
                        SELECT e.id INTO target_employee_id
                        FROM employees e
                        WHERE 
                            CASE 
                                WHEN t.meta_data->>'category' = 'giảng_dạy' THEN 
                                    e.position IN ('Giáo viên', 'Trợ giảng') OR e.data->>'position' IN ('Giáo viên', 'Trợ giảng')
                                WHEN t.meta_data->>'category' = 'nhân_sự' THEN 
                                    e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Hành chính nhân sự'
                                WHEN t.meta_data->>'category' = 'quản_lý' THEN 
                                    e.position IN ('Quản lý', 'Phó giám đốc', 'Giám đốc', 'Tổ trưởng') OR e.data->>'position' IN ('Quản lý', 'Phó giám đốc', 'Giám đốc', 'Tổ trưởng') OR e.data->>'department' = 'Ban giám đốc'
                                ELSE TRUE
                            END
                        LIMIT 1;
                    END IF;
                    
                    -- Tạo task instance nếu chưa tồn tại
                    INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status)
                    VALUES (t.task_id, target_employee_id, d + TIME '09:00:00', 'pending')
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END IF;

        -- Xử lý công việc lặp lại hàng tháng
        IF (t.frequency->>'repeat') = 'monthly' THEN
            current_month := EXTRACT(MONTH FROM CURRENT_DATE);
            current_year := EXTRACT(YEAR FROM CURRENT_DATE);
            target_day := (t.frequency->>'day_of_month')::INT;
            
            -- Tạo cho tháng hiện tại
            BEGIN
                target_employee_id := t.created_by_employee_id;
                
                IF target_employee_id IS NULL THEN
                    SELECT e.id INTO target_employee_id
                    FROM employees e
                    WHERE 
                        CASE 
                            WHEN t.meta_data->>'category' = 'nhân_sự' THEN 
                                e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Hành chính nhân sự'
                            WHEN t.meta_data->>'category' = 'kế_toán' THEN 
                                e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Tài chính'
                            ELSE TRUE
                        END
                    LIMIT 1;
                END IF;
                
                INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status)
                VALUES (
                    t.task_id,
                    target_employee_id,
                    make_date(current_year, current_month, target_day) + TIME '17:00:00',
                    'pending'
                )
                ON CONFLICT DO NOTHING;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Bỏ qua nếu ngày không hợp lệ (ví dụ: 31/2)
                    CONTINUE;
            END;
            
            -- Tạo cho tháng sau
            BEGIN
                IF current_month = 12 THEN
                    current_month := 1;
                    current_year := current_year + 1;
                ELSE
                    current_month := current_month + 1;
                END IF;
                
                INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status)
                VALUES (
                    t.task_id,
                    target_employee_id,
                    make_date(current_year, current_month, target_day) + TIME '17:00:00',
                    'pending'
                )
                ON CONFLICT DO NOTHING;
            EXCEPTION
                WHEN OTHERS THEN
                    CONTINUE;
            END;
        END IF;

        -- Xử lý công việc lặp lại hàng ngày
        IF (t.frequency->>'repeat') = 'daily' THEN
            FOR d IN CURRENT_DATE..(CURRENT_DATE + INTERVAL '7 days') LOOP
                target_employee_id := t.created_by_employee_id;
                
                IF target_employee_id IS NULL THEN
                    SELECT e.id INTO target_employee_id
                    FROM employees e
                    WHERE 
                        CASE 
                            WHEN t.meta_data->>'category' = 'an_ninh' THEN 
                                e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Vận hành'
                            WHEN t.meta_data->>'category' = 'vệ_sinh' THEN 
                                e.position = 'Nhân viên' OR e.data->>'position' = 'Nhân viên' OR e.data->>'department' = 'Vận hành'
                            ELSE TRUE
                        END
                    LIMIT 1;
                END IF;
                
                INSERT INTO task_instances (task_id, assigned_to_employee_id, due_date, status)
                VALUES (
                    t.task_id, 
                    target_employee_id, 
                    d + (t.frequency->>'time')::TIME,
                    'pending'
                )
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
    
    -- Cập nhật trạng thái overdue cho các task instances quá hạn
    UPDATE task_instances 
    SET status = 'overdue' 
    WHERE due_date < NOW() AND status = 'pending';
    
    RAISE NOTICE 'Task instances generated successfully for % repeated tasks', 
        (SELECT COUNT(*) FROM tasks WHERE task_type = 'repeated');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HÀM THỐNG KÊ CÔNG VIỆC
-- Task Statistics Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_task_statistics(employee_id_param TEXT DEFAULT NULL)
RETURNS TABLE(
    total_pending INT,
    total_completed INT,
    total_overdue INT,
    completion_rate DECIMAL,
    avg_completion_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN ti.status = 'pending' THEN 1 END)::INT as total_pending,
        COUNT(CASE WHEN ti.status = 'completed' THEN 1 END)::INT as total_completed,
        COUNT(CASE WHEN ti.status = 'overdue' THEN 1 END)::INT as total_overdue,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(COUNT(CASE WHEN ti.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 2)
            ELSE 0
        END as completion_rate,
        AVG(CASE 
            WHEN ti.status = 'completed' AND ti.completion_data->>'completed_at' IS NOT NULL THEN 
                (ti.completion_data->>'completed_at')::TIMESTAMP - ti.created_at
            ELSE NULL
        END) as avg_completion_time
    FROM task_instances ti
    WHERE 
        CASE 
            WHEN employee_id_param IS NOT NULL THEN ti.assigned_to_employee_id = employee_id_param
            ELSE TRUE
        END
        AND ti.created_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HÀM LẤY CÔNG VIỆC SẮP TỚI HẠN
-- Get Upcoming Tasks Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_upcoming_tasks(days_ahead INT DEFAULT 7, employee_id_param TEXT DEFAULT NULL)
RETURNS TABLE(
    task_instance_id INT,
    task_title TEXT,
    task_description TEXT,
    due_date TIMESTAMP,
    assigned_to_name TEXT,
    category TEXT,
    priority TEXT,
    days_until_due INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.task_instance_id,
        t.title as task_title,
        t.description as task_description,
        ti.due_date,
        e.full_name as assigned_to_name,
        t.meta_data->>'category' as category,
        t.meta_data->>'priority' as priority,
        EXTRACT(DAY FROM ti.due_date - NOW())::INT as days_until_due
    FROM task_instances ti
    JOIN tasks t ON ti.task_id = t.task_id
    LEFT JOIN employees e ON ti.assigned_to_employee_id = e.id
    WHERE 
        ti.status = 'pending'
        AND ti.due_date BETWEEN NOW() AND NOW() + INTERVAL '%s days'
        AND CASE 
            WHEN employee_id_param IS NOT NULL THEN ti.assigned_to_employee_id = employee_id_param
            ELSE TRUE
        END
    ORDER BY ti.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT THỜI GIAN
-- Auto Update Timestamp Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo triggers cho các bảng
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_instances_updated_at ON task_instances;
CREATE TRIGGER update_task_instances_updated_at
    BEFORE UPDATE ON task_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HƯỚNG DẪN SỬ DỤNG
-- Usage Instructions
-- =====================================================

/*
1. Chạy hàm tạo task instances tự động:
   SELECT generate_task_instances();

2. Xem thống kê công việc tổng thể:
   SELECT * FROM get_task_statistics();

3. Xem thống kê công việc của một nhân viên cụ thể:
   SELECT * FROM get_task_statistics('employee_id_here');

4. Xem công việc sắp tới trong 7 ngày:
   SELECT * FROM get_upcoming_tasks();

5. Xem công việc sắp tới của một nhân viên trong 3 ngày:
   SELECT * FROM get_upcoming_tasks(3, 'employee_id_here');

6. Đánh dấu hoàn thành một task instance:
   UPDATE task_instances 
   SET status = 'completed', 
       completion_data = jsonb_set(
           COALESCE(completion_data, '{}'), 
           '{completed_at}', 
           to_jsonb(NOW()::TEXT)
       )
   WHERE task_instance_id = 123;

7. Thêm comment cho task instance:
   INSERT INTO task_comments (task_instance_id, employee_id, comment)
   VALUES (123, 'employee_id', 'Đã hoàn thành công việc đúng hạn');
*/
