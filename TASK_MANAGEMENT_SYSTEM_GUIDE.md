# Hệ Thống Quản Lý Công Việc - Task Management System Guide

## Tổng Quan (Overview)

Hệ thống quản lý công việc cho trung tâm tiếng Anh với khả năng tạo công việc lặp lại tự động và theo dõi tiến độ hoàn thành.

## Cấu Trúc Database

### Bảng Chính (Main Tables)

1. **`tasks`** - Mẫu công việc và công việc tùy chỉnh
2. **`task_instances`** - Các lần thực hiện cụ thể của công việc
3. **`task_comments`** - Bình luận và ghi chú cho từng task instance

### Cấu Trúc JSONB

- **`frequency`**: Định nghĩa tần suất lặp lại
- **`meta_data`**: Thông tin bổ sung (danh mục, ưu tiên, thời gian ước tính)
- **`completion_data`**: Dữ liệu hoàn thành (ghi chú, thời gian hoàn thành)

## Cài Đặt (Installation)

### 1. Tạo Schema và Dữ Liệu Mẫu
```sql
-- Chạy script tạo bảng và dữ liệu mẫu
\i scripts/create-task-management-system.sql
```

### 2. Thêm Các Hàm Tự Động
```sql
-- Chạy script tạo các hàm scheduler và thống kê
\i scripts/task-scheduler-function.sql
```

## Sử Dụng Hệ Thống

### 1. Tạo Task Instances Tự Động
```sql
-- Chạy hàm này hàng ngày để tạo task instances mới
SELECT generate_task_instances();
```

### 2. Xem Thống Kê Công Việc
```sql
-- Thống kê tổng thể
SELECT * FROM get_task_statistics();

-- Thống kê của một nhân viên cụ thể
SELECT * FROM get_task_statistics('employee_uuid_here');
```

### 3. Xem Công Việc Sắp Tới
```sql
-- Công việc trong 7 ngày tới
SELECT * FROM get_upcoming_tasks();

-- Công việc của một nhân viên trong 3 ngày tới
SELECT * FROM get_upcoming_tasks(3, 'employee_uuid_here');
```

### 4. Đánh Dấu Hoàn Thành Công Việc
```sql
UPDATE task_instances 
SET status = 'completed', 
    completion_data = jsonb_set(
        COALESCE(completion_data, '{}'), 
        '{completed_at}', 
        to_jsonb(NOW()::TEXT)
    ),
    completion_data = jsonb_set(
        completion_data, 
        '{notes}', 
        to_jsonb('Hoàn thành đúng hạn')
    )
WHERE task_instance_id = 123;
```

### 5. Thêm Bình Luận
```sql
INSERT INTO task_comments (task_instance_id, employee_id, comment)
VALUES (123, 'employee_uuid', 'Đã hoàn thành công việc, cần theo dõi thêm');
```

## Các Loại Công Việc Mẫu

### 1. Công Việc Giảng Dạy
- **Chuẩn bị giáo án**: Hàng tuần (Thứ 2, Thứ 5)
- **Chấm bài kiểm tra**: Hàng tuần (Chủ Nhật)
- **Liên hệ phụ huynh**: Theo yêu cầu

### 2. Công Việc Quản Lý
- **Họp đánh giá chất lượng**: Hàng tuần (Thứ 6)
- **Chuẩn bị báo cáo**: Hàng tháng

### 3. Công Việc Hành Chính
- **Cập nhật hồ sơ học sinh**: Theo yêu cầu
- **Chuẩn bị bảng lương**: Hàng tháng (ngày 25)

### 4. Công Việc Vận Hành
- **Kiểm tra an ninh**: Hàng ngày (18:00)
- **Bảo trì thiết bị**: Hàng tuần

## Tần Suất Lặp Lại (Frequency Patterns)

### Hàng Tuần (Weekly)
```json
{
  "repeat": "weekly",
  "days": ["Thứ Hai", "Thứ Năm"]
}
```

### Hàng Tháng (Monthly)
```json
{
  "repeat": "monthly",
  "day_of_month": 25
}
```

### Hàng Ngày (Daily)
```json
{
  "repeat": "daily",
  "time": "18:00"
}
```

## Metadata Categories

### Danh Mục Công Việc
- `giảng_dạy` - Giảng dạy
- `quản_lý` - Quản lý
- `nhân_sự` - Nhân sự
- `hành_chính` - Hành chính
- `kế_toán` - Kế toán
- `marketing` - Marketing
- `an_ninh` - An ninh
- `vệ_sinh` - Vệ sinh

### Mức Độ Ưu Tiên
- `cao` - High priority
- `trung_bình` - Medium priority
- `thấp` - Low priority

## API Endpoints Đề Xuất

### GET /api/tasks
Lấy danh sách tasks và task instances
```javascript
// Query parameters
{
  employee_id?: string,
  status?: 'pending' | 'completed' | 'overdue',
  category?: string,
  date_from?: string,
  date_to?: string
}
```

### POST /api/tasks
Tạo task mới
```javascript
{
  title: string,
  description: string,
  task_type: 'repeated' | 'custom',
  frequency?: object,
  meta_data?: object,
  assigned_to?: string
}
```

### PATCH /api/task-instances/:id
Cập nhật trạng thái task instance
```javascript
{
  status: 'pending' | 'completed' | 'overdue',
  completion_data?: object
}
```

### POST /api/task-comments
Thêm bình luận
```javascript
{
  task_instance_id: number,
  comment: string
}
```

## Tự Động Hóa (Automation)

### Cron Job Hàng Ngày
```bash
# Thêm vào crontab để chạy hàng ngày lúc 6:00 sáng
0 6 * * * psql -d your_database -c "SELECT generate_task_instances();"
```

### Cron Job Cập Nhật Trạng thái
```bash
# Cập nhật trạng thái overdue mỗi giờ
0 * * * * psql -d your_database -c "UPDATE task_instances SET status = 'overdue' WHERE due_date < NOW() AND status = 'pending';"
```

## Báo Cáo và Thống Kê

### Dashboard Metrics
- Tổng số công việc pending/completed/overdue
- Tỷ lệ hoàn thành theo nhân viên
- Thời gian hoàn thành trung bình
- Công việc quá hạn theo danh mục

### Báo Cáo Hàng Tuần
```sql
-- Báo cáo hiệu suất nhân viên trong tuần
SELECT 
    e.full_name,
    COUNT(CASE WHEN ti.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN ti.status = 'overdue' THEN 1 END) as overdue_tasks,
    ROUND(
        COUNT(CASE WHEN ti.status = 'completed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as completion_rate
FROM employees e
LEFT JOIN task_instances ti ON e.id = ti.assigned_to_employee_id
WHERE ti.due_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY e.id, e.full_name
ORDER BY completion_rate DESC;
```

## Mở Rộng Hệ Thống

### Thêm Loại Công Việc Mới
1. Thêm task template vào bảng `tasks`
2. Cập nhật logic trong `generate_task_instances()`
3. Thêm category mới vào metadata

### Tích Hợp Notification
- Email notifications cho công việc sắp đến hạn
- SMS alerts cho công việc quan trọng
- Push notifications trên mobile app

### Mobile App Integration
- API endpoints cho mobile app
- Offline sync capability
- Photo attachments cho completion data

## Troubleshooting

### Lỗi Thường Gặp
1. **Foreign key constraint errors**: Kiểm tra employee_id có tồn tại
2. **JSONB format errors**: Validate JSON structure trước khi insert
3. **Timezone issues**: Sử dụng TIMESTAMP WITH TIME ZONE

### Performance Optimization
- Tạo indexes cho các truy vấn thường dùng
- Partition bảng task_instances theo tháng
- Archive old completed tasks

## Bảo Mật

### Row Level Security
```sql
-- Chỉ cho phép nhân viên xem task của mình
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_instances_policy ON task_instances
    FOR ALL TO authenticated
    USING (assigned_to_employee_id = auth.uid());
```

### Audit Trail
- Log tất cả thay đổi trạng thái
- Track user actions
- Backup completion data

---

## Liên Hệ Hỗ Trợ

Để được hỗ trợ kỹ thuật hoặc đóng góp ý kiến cải thiện hệ thống, vui lòng liên hệ team phát triển.
