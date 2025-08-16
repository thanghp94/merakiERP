

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."department" AS ENUM (
    'Hành chính nhân sự',
    'Vận hành',
    'Chăm sóc khách hàng',
    'Tài chính',
    'Ban giám đốc'
);


ALTER TYPE "public"."department" OWNER TO "postgres";


COMMENT ON TYPE "public"."department" IS 'phòng ban trong công ty';



CREATE TYPE "public"."finance_category_enum" AS ENUM (
    'tuition_fee',
    'registration_fee',
    'material_fee',
    'exam_fee',
    'private_lesson_fee',
    'summer_course_fee',
    'late_fee',
    'other_income',
    'staff_salary',
    'teacher_bonus',
    'facility_rent',
    'utilities',
    'equipment',
    'marketing',
    'maintenance',
    'office_supplies',
    'transportation',
    'insurance',
    'training',
    'other_expense'
);


ALTER TYPE "public"."finance_category_enum" OWNER TO "postgres";


CREATE TYPE "public"."lesson_grapeseed_type" AS ENUM (
    'L1',
    'L2',
    'L3',
    'L4',
    'L5',
    'L6',
    'L7',
    'L8',
    'L9',
    'L10',
    'L11',
    'L12',
    'L13',
    'L14',
    'L15',
    'L16',
    'L17',
    'L18',
    'L19',
    'L20',
    'L21',
    'L22',
    'L23',
    'L24',
    'L25',
    'L26',
    'L27',
    'L28',
    'L29',
    'L30',
    'L31',
    'L32',
    'L33',
    'L34',
    'L35',
    'L36',
    'L37',
    'L38',
    'L39',
    'L40'
);


ALTER TYPE "public"."lesson_grapeseed_type" OWNER TO "postgres";


CREATE TYPE "public"."loai_co_so" AS ENUM (
    'Meraki',
    'Trường đối tác'
);


ALTER TYPE "public"."loai_co_so" OWNER TO "postgres";


CREATE TYPE "public"."payment_method_enum" AS ENUM (
    'cash',
    'bank_transfer',
    'credit_card',
    'debit_card',
    'online_payment',
    'mobile_payment',
    'check'
);


ALTER TYPE "public"."payment_method_enum" OWNER TO "postgres";


CREATE TYPE "public"."position" AS ENUM (
    'Giáo viên',
    'Trợ giảng',
    'Tổ trưởng',
    'Nhân viên',
    'Thực tập sinh',
    'Quản lý',
    'Phó giám đốc',
    'Giám đốc'
);


ALTER TYPE "public"."position" OWNER TO "postgres";


COMMENT ON TYPE "public"."position" IS 'G';



CREATE TYPE "public"."program_type" AS ENUM (
    'GrapeSEED',
    'Pre-WSC',
    'WSC',
    'Tiếng Anh Tiểu Học',
    'Gavel club'
);


ALTER TYPE "public"."program_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."program_type" IS 'chương trình học';



CREATE TYPE "public"."unit_grapeseed" AS ENUM (
    'U1',
    'U2',
    'U3',
    'U4',
    'U5',
    'U6',
    'U7',
    'U8',
    'U9',
    'U10',
    'U11',
    'U12',
    'U13',
    'U14',
    'U15',
    'U16',
    'U17',
    'U18',
    'U19',
    'U20',
    'U21',
    'U22',
    'U23',
    'U24',
    'U25',
    'U26',
    'U27',
    'U28',
    'U29',
    'U30'
);


ALTER TYPE "public"."unit_grapeseed" OWNER TO "postgres";


COMMENT ON TYPE "public"."unit_grapeseed" IS 'unit grapeseed ';



CREATE OR REPLACE FUNCTION "public"."calculate_vietnamese_income_tax"("taxable_income" numeric, "dependents" integer DEFAULT 0) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  personal_deduction DECIMAL(15,2) := 11000000; -- 2024 rate
  dependent_deduction DECIMAL(15,2) := 4400000; -- per dependent 2024
  net_taxable_income DECIMAL(15,2);
  tax_amount DECIMAL(15,2) := 0;
  bracket RECORD;
BEGIN
  -- Calculate net taxable income after deductions
  net_taxable_income := taxable_income - personal_deduction - (dependents * dependent_deduction);
  
  -- If no taxable income, return 0
  IF net_taxable_income <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate progressive tax
  FOR bracket IN 
    SELECT * FROM vn_tax_brackets 
    WHERE year = EXTRACT(YEAR FROM NOW()) AND is_active = true
    ORDER BY min_income
  LOOP
    IF net_taxable_income > bracket.min_income THEN
      DECLARE
        taxable_in_bracket DECIMAL(15,2);
      BEGIN
        IF bracket.max_income IS NULL THEN
          taxable_in_bracket := net_taxable_income - bracket.min_income;
        ELSE
          taxable_in_bracket := LEAST(net_taxable_income, bracket.max_income) - bracket.min_income;
        END IF;
        
        tax_amount := tax_amount + (taxable_in_bracket * bracket.tax_rate / 100);
      END;
    END IF;
  END LOOP;
  
  RETURN ROUND(tax_amount, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_vietnamese_income_tax"("taxable_income" numeric, "dependents" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_vietnamese_social_insurance"("gross_salary" numeric, "insurance_base" numeric DEFAULT NULL::numeric) RETURNS TABLE("bhxh_employee" numeric, "bhyt_employee" numeric, "bhtn_employee" numeric, "bhxh_employer" numeric, "bhyt_employer" numeric, "bhtn_employer" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_amount DECIMAL(15,2);
  max_bhxh_base DECIMAL(15,2) := 29800000; -- 2024 limit
  min_bhxh_base DECIMAL(15,2) := 4680000;  -- 2024 minimum wage
BEGIN
  -- Use provided insurance base or gross salary
  base_amount := COALESCE(insurance_base, gross_salary);
  
  -- Apply limits
  base_amount := GREATEST(base_amount, min_bhxh_base);
  base_amount := LEAST(base_amount, max_bhxh_base);
  
  RETURN QUERY SELECT
    ROUND(base_amount * 0.08, 0)::DECIMAL(15,2), -- BHXH employee 8%
    ROUND(base_amount * 0.015, 0)::DECIMAL(15,2), -- BHYT employee 1.5%
    ROUND(base_amount * 0.01, 0)::DECIMAL(15,2),  -- BHTN employee 1%
    ROUND(base_amount * 0.175, 0)::DECIMAL(15,2), -- BHXH employer 17.5%
    ROUND(base_amount * 0.03, 0)::DECIMAL(15,2),  -- BHYT employer 3%
    ROUND(base_amount * 0.01, 0)::DECIMAL(15,2);  -- BHTN employer 1%
END;
$$;


ALTER FUNCTION "public"."calculate_vietnamese_social_insurance"("gross_salary" numeric, "insurance_base" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payroll_invoice"("p_payroll_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  payroll_rec RECORD;
  invoice_id UUID;
  invoice_number TEXT;
  period_name TEXT;
BEGIN
  -- Get payroll record details
  SELECT pr.*, pp.period_name, e.full_name, e.employee_code
  INTO payroll_rec
  FROM payroll_records pr
  JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
  JOIN employees e ON pr.employee_id = e.id
  WHERE pr.id = p_payroll_record_id;
  
  -- Generate invoice number
  invoice_number := 'PAYROLL-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                   LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' ||
                   COALESCE(payroll_rec.employee_code, payroll_rec.employee_id::TEXT);
  
  -- Create invoice
  INSERT INTO invoices (
    invoice_number,
    invoice_date,
    employee_id,
    is_income,
    invoice_type,
    total_amount,
    status,
    description,
    data
  ) VALUES (
    invoice_number,
    CURRENT_DATE,
    payroll_rec.employee_id,
    false, -- This is an expense (salary payment)
    'payroll',
    payroll_rec.net_salary,
    'approved',
    'Lương tháng ' || payroll_rec.period_name || ' - ' || payroll_rec.full_name,
    jsonb_build_object(
      'payroll_record_id', p_payroll_record_id,
      'period_name', payroll_rec.period_name,
      'gross_salary', payroll_rec.gross_salary,
      'total_deductions', payroll_rec.total_deductions,
      'net_salary', payroll_rec.net_salary
    )
  ) RETURNING id INTO invoice_id;
  
  -- Create invoice items for salary components
  INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount, data)
  VALUES 
    (invoice_id, 'Lương cơ bản', 'staff_salary', 1, payroll_rec.base_salary, payroll_rec.base_salary, 
     jsonb_build_object('type', 'base_salary')),
    (invoice_id, 'Khấu trừ BHXH', 'staff_salary', 1, -payroll_rec.bhxh_employee, -payroll_rec.bhxh_employee,
     jsonb_build_object('type', 'bhxh_deduction')),
    (invoice_id, 'Khấu trừ BHYT', 'staff_salary', 1, -payroll_rec.bhyt_employee, -payroll_rec.bhyt_employee,
     jsonb_build_object('type', 'bhyt_deduction')),
    (invoice_id, 'Thuế TNCN', 'staff_salary', 1, -payroll_rec.personal_income_tax, -payroll_rec.personal_income_tax,
     jsonb_build_object('type', 'income_tax'));
  
  -- Update payroll record with invoice_id
  UPDATE payroll_records SET invoice_id = invoice_id WHERE id = p_payroll_record_id;
  
  RETURN invoice_id;
END;
$$;


ALTER FUNCTION "public"."create_payroll_invoice"("p_payroll_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_sample_invoice_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    sample_student_id UUID;
    sample_employee_id UUID;
    sample_class_id UUID;
    sample_invoice_id UUID;
BEGIN
    -- Get sample IDs
    SELECT id INTO sample_student_id FROM students LIMIT 1;
    SELECT id INTO sample_employee_id FROM employees LIMIT 1;
    SELECT id INTO sample_class_id FROM classes LIMIT 1;
    
    IF sample_student_id IS NOT NULL THEN
        -- Tạo sample invoice cho học sinh
        INSERT INTO invoices (
            student_id, 
            class_id,
            is_income, 
            description,
            status
        ) VALUES (
            sample_student_id,
            sample_class_id,
            true,
            'Học phí tháng 1/2024',
            'completed'
        ) RETURNING id INTO sample_invoice_id;
        
        -- Add items
        INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
        (sample_invoice_id, 'Học phí GrapeSEED Unit 1', 'tuition_fee', 1, 2000000, 2000000),
        (sample_invoice_id, 'Phí tài liệu', 'material_fee', 1, 200000, 200000);
    END IF;
    
    IF sample_employee_id IS NOT NULL THEN
        -- Tạo sample invoice cho nhân viên
        INSERT INTO invoices (
            employee_id,
            is_income, 
            description,
            status
        ) VALUES (
            sample_employee_id,
            false,
            'Lương tháng 1/2024',
            'completed'
        ) RETURNING id INTO sample_invoice_id;
        
        -- Add salary item
        INSERT INTO invoice_items (invoice_id, item_name, category, quantity, unit_price, total_amount) VALUES
        (sample_invoice_id, 'Lương cơ bản', 'staff_salary', 1, 15000000, 15000000);
    END IF;
    
    RAISE NOTICE 'Sample invoice data created successfully!';
END;
$$;


ALTER FUNCTION "public"."create_sample_invoice_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^INV-' || current_year || current_month || '-[0-9]+$')
            THEN SUBSTRING(invoice_number FROM LENGTH('INV-' || current_year || current_month || '-') + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM invoices;
    
    invoice_num := 'INV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$_$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_task_instances"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_task_instances"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_by_email"("p_email" "text") RETURNS TABLE("id" "uuid", "full_name" "text", "emp_position" "text", "department" "text", "status" "text", "data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e."position"::text, e.department::text, 
         e.status, e.data, e.created_at, e.updated_at, e.user_id
  FROM public.employees e
  WHERE LOWER(e.data->>'email') = LOWER(p_email) 
    AND e.status = 'active'
    AND e.user_id IS NULL; -- Only return unlinked employees
END;
$$;


ALTER FUNCTION "public"."get_employee_by_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_by_user_id"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "full_name" "text", "emp_position" "text", "department" "text", "status" "text", "data" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.full_name, e."position"::text, e.department::text, 
         e.status, e.data, e.created_at, e.updated_at, e.user_id
  FROM public.employees e
  WHERE e.user_id = p_user_id AND e.status = 'active';
END;
$$;


ALTER FUNCTION "public"."get_employee_by_user_id"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_enum_values"("enum_type_name" "text") RETURNS TABLE("value" "text", "label" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.enumlabel::text as value,
        e.enumlabel::text as label
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_type_name
    ORDER BY e.enumsortorder;
END;
$$;


ALTER FUNCTION "public"."get_enum_values"("enum_type_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_finance_category_labels"() RETURNS TABLE("value" "text", "label_en" "text", "label_vi" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY VALUES
    -- Thu nhập
    ('tuition_fee', 'Tuition Fee', 'Học phí'),
    ('registration_fee', 'Registration Fee', 'Phí đăng ký'),
    ('material_fee', 'Material Fee', 'Phí tài liệu'),
    ('exam_fee', 'Exam Fee', 'Phí thi'),
    ('private_lesson_fee', 'Private Lesson Fee', 'Phí học riêng'),
    ('other_income', 'Other Income', 'Thu nhập khác'),
    
    -- Chi phí
    ('staff_salary', 'Staff Salary', 'Lương nhân viên'),
    ('teacher_bonus', 'Teacher Bonus', 'Thưởng giáo viên'),
    ('facility_rent', 'Facility Rent', 'Tiền thuê mặt bằng'),
    ('utilities', 'Utilities', 'Tiện ích'),
    ('equipment', 'Equipment', 'Thiết bị'),
    ('marketing', 'Marketing', 'Marketing'),
    ('office_supplies', 'Office Supplies', 'Văn phòng phẩm'),
    ('other_expense', 'Other Expense', 'Chi phí khác');
END;
$$;


ALTER FUNCTION "public"."get_finance_category_labels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payment_method_labels"() RETURNS TABLE("value" "text", "label_en" "text", "label_vi" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY VALUES
    ('cash', 'Cash', 'Tiền mặt'),
    ('bank_transfer', 'Bank Transfer', 'Chuyển khoản'),
    ('credit_card', 'Credit Card', 'Thẻ tín dụng'),
    ('online_payment', 'Online Payment', 'Thanh toán online'),
    ('mobile_payment', 'Mobile Payment', 'Thanh toán di động');
END;
$$;


ALTER FUNCTION "public"."get_payment_method_labels"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_task_statistics"("employee_id_param" "text" DEFAULT NULL::"text") RETURNS TABLE("total_pending" integer, "total_completed" integer, "total_overdue" integer, "completion_rate" numeric, "avg_completion_time" interval)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_task_statistics"("employee_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_upcoming_tasks"("days_ahead" integer DEFAULT 7, "employee_id_param" "text" DEFAULT NULL::"text") RETURNS TABLE("task_instance_id" integer, "task_title" "text", "task_description" "text", "due_date" timestamp without time zone, "assigned_to_name" "text", "category" "text", "priority" "text", "days_until_due" integer)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_upcoming_tasks"("days_ahead" integer, "employee_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employees_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_employees_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    invoice_total DECIMAL(15,2);
    total_paid DECIMAL(15,2);
    invoice_status VARCHAR(20);
BEGIN
    -- Get the invoice_id from either NEW or OLD record
    DECLARE
        target_invoice_id UUID;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            target_invoice_id := OLD.invoice_id;
        ELSE
            target_invoice_id := NEW.invoice_id;
        END IF;
        
        -- Get invoice total
        SELECT total_amount INTO invoice_total
        FROM invoices 
        WHERE id = target_invoice_id;
        
        -- Calculate total paid amount
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM invoice_payments 
        WHERE invoice_id = target_invoice_id;
        
        -- Determine status
        IF total_paid = 0 THEN
            invoice_status := 'draft';
        ELSIF total_paid >= invoice_total THEN
            invoice_status := 'paid';
        ELSE
            invoice_status := 'partial';
        END IF;
        
        -- Update invoice
        UPDATE invoices 
        SET 
            paid_amount = total_paid,
            remaining_amount = invoice_total - total_paid,
            status = invoice_status,
            updated_at = NOW()
        WHERE id = target_invoice_id;
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_invoice_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_payments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invoice_payments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invoice_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    invoice_subtotal DECIMAL(15,2);
    invoice_tax DECIMAL(15,2);
    invoice_total DECIMAL(15,2);
    invoice_paid DECIMAL(15,2);
    invoice_remaining DECIMAL(15,2);
    invoice_record RECORD;
    new_status TEXT;
BEGIN
    -- Get invoice_id (works for both INSERT and DELETE)
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO invoice_record FROM invoices WHERE id = OLD.invoice_id;
    ELSE
        SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
    END IF;

    -- If no invoice found, return
    IF invoice_record IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calculate subtotal from invoice items
    SELECT COALESCE(SUM(total_amount), 0)
    INTO invoice_subtotal
    FROM invoice_items
    WHERE invoice_id = invoice_record.id;

    -- Calculate tax and total
    invoice_tax := invoice_subtotal * (COALESCE(invoice_record.tax_rate, 0) / 100);
    invoice_total := invoice_subtotal + invoice_tax - COALESCE(invoice_record.discount_amount, 0);

    -- Calculate paid amount from finances (only if finances table has status column)
    BEGIN
        SELECT COALESCE(SUM(amount), 0)
        INTO invoice_paid
        FROM finances
        WHERE invoice_id = invoice_record.id 
        AND (status IS NULL OR status = 'completed');
    EXCEPTION WHEN OTHERS THEN
        -- If status column doesn't exist, just sum all amounts
        SELECT COALESCE(SUM(amount), 0)
        INTO invoice_paid
        FROM finances
        WHERE invoice_id = invoice_record.id;
    END;

    invoice_remaining := invoice_total - invoice_paid;

    -- Determine status
    IF invoice_paid = 0 THEN
        new_status := CASE
            WHEN invoice_record.due_date IS NOT NULL AND invoice_record.due_date < CURRENT_DATE THEN 'overdue'
            WHEN invoice_record.status = 'draft' THEN 'draft'
            ELSE 'sent'
        END;
    ELSIF invoice_paid >= invoice_total THEN
        new_status := 'paid';
    ELSE
        new_status := 'partial';
    END IF;

    -- Update invoice totals
    UPDATE invoices
    SET
        subtotal = invoice_subtotal,
        tax_amount = invoice_tax,
        total_amount = invoice_total,
        paid_amount = invoice_paid,
        remaining_amount = invoice_remaining,
        status = new_status,
        updated_at = NOW()
    WHERE id = invoice_record.id;

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Log error and return without failing the transaction
    RAISE WARNING 'Error in update_invoice_totals: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_invoice_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text",
    "table_name" "text",
    "record_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "application_date" "date" DEFAULT "now"(),
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "student_name" "text",
    "phone" character varying,
    "email" character varying,
    "parent_name" "text",
    "location" "text"
);


ALTER TABLE "public"."admissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid",
    "from_facility_id" "uuid",
    "to_facility_id" "uuid",
    "transfer_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."asset_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "facility_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "quantity" integer,
    "unit" "text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "main_session_id" "uuid",
    "enrollment_id" "uuid",
    "status" "text" DEFAULT 'present'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_name" "text" NOT NULL,
    "facility_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "start_date" "date",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "program_type" "public"."program_type",
    "current_unit" character varying(10)
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_clock_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "work_date" "date",
    "clock_in_time" timestamp with time zone,
    "clock_out_time" timestamp with time zone,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employee_clock_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "position" "public"."position",
    "department" "public"."department",
    "status" "text" DEFAULT 'active'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "class_id" "uuid",
    "enrollment_date" "date",
    "status" "text" DEFAULT 'active'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "value" "text" NOT NULL,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "class_id" "uuid",
    "evaluation_date" "date",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "facility_id" "uuid",
    "event_date" "date",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."loai_co_so"
);


ALTER TABLE "public"."facilities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."facilities"."type" IS 'loại cơ sở';



CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "facility_id" "uuid",
    "student_id" "uuid",
    "employee_id" "uuid",
    "transaction_date" "date",
    "transaction_type" "text",
    "amount" numeric(15,2),
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "public"."finance_category_enum",
    "payment_method" "public"."payment_method_enum" DEFAULT 'cash'::"public"."payment_method_enum",
    "reference_number" character varying(100),
    "is_income" boolean DEFAULT true,
    "due_date" "date",
    "notes" "text",
    "invoice_id" "uuid",
    "status" "text" DEFAULT 'completed'::"text",
    CONSTRAINT "finances_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."finances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finances_backup" (
    "id" "uuid",
    "facility_id" "uuid",
    "student_id" "uuid",
    "employee_id" "uuid",
    "transaction_date" "date",
    "transaction_type" "text",
    "amount" numeric(15,2),
    "data" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "category" "public"."finance_category_enum",
    "payment_method" "public"."payment_method_enum",
    "reference_number" character varying(100),
    "is_income" boolean,
    "due_date" "date",
    "notes" "text"
);


ALTER TABLE "public"."finances_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "item_description" "text" DEFAULT ''::"text",
    "category" "text" NOT NULL,
    "quantity" numeric(10,2) DEFAULT 1,
    "unit_price" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "payment_date" "date" NOT NULL,
    "reference_number" character varying(100),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoice_payments_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "invoice_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "due_date" "date",
    "student_id" "uuid",
    "employee_id" "uuid",
    "facility_id" "uuid",
    "class_id" "uuid",
    "is_income" boolean DEFAULT false NOT NULL,
    "invoice_type" "text" DEFAULT 'standard'::"text" NOT NULL,
    "subtotal" numeric(15,2) DEFAULT 0 NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "discount_amount" numeric(15,2) DEFAULT 0,
    "total_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "paid_amount" numeric(15,2) DEFAULT 0,
    "remaining_amount" numeric(15,2) DEFAULT 0,
    "description" "text",
    "notes" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'partial'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."main_sessions" (
    "main_session_name" character varying(255) NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "class_id" "uuid",
    "lesson_id" "text",
    "main_session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "data" "jsonb"
);


ALTER TABLE "public"."main_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "class_id" "uuid",
    "total_amount" numeric(10,2) NOT NULL,
    "paid_amount" numeric(10,2) DEFAULT 0,
    "remaining_amount" numeric(10,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_schedules_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'partial'::character varying, 'completed'::character varying, 'overdue'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "month" integer,
    "year" integer,
    "payment_date" "date",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_name" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_periods_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'processing'::"text", 'approved'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."payroll_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "payroll_period_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "base_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "working_days" integer DEFAULT 0,
    "actual_working_days" integer DEFAULT 0,
    "allowances" "jsonb" DEFAULT '{}'::"jsonb",
    "bonuses" "jsonb" DEFAULT '{}'::"jsonb",
    "gross_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "bhxh_employee" numeric(15,2) DEFAULT 0,
    "bhyt_employee" numeric(15,2) DEFAULT 0,
    "bhtn_employee" numeric(15,2) DEFAULT 0,
    "personal_income_tax" numeric(15,2) DEFAULT 0,
    "other_deductions" "jsonb" DEFAULT '{}'::"jsonb",
    "total_deductions" numeric(15,2) DEFAULT 0,
    "net_salary" numeric(15,2) DEFAULT 0 NOT NULL,
    "bhxh_employer" numeric(15,2) DEFAULT 0,
    "bhyt_employer" numeric(15,2) DEFAULT 0,
    "bhtn_employer" numeric(15,2) DEFAULT 0,
    "notes" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payroll_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb"
);


ALTER TABLE "public"."requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data" "jsonb",
    "main_session_id" "uuid" DEFAULT "gen_random_uuid"(),
    "subject_type" "text" DEFAULT 'TSI'::"text",
    "teacher_id" "uuid",
    "location_id" "text",
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "teaching_assistant_id" "uuid",
    "date" "date"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "teaching_session_id" "uuid",
    "due_date" "date",
    "status" "text" DEFAULT 'assigned'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "status" "text" DEFAULT 'active'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "comment_id" integer NOT NULL,
    "task_instance_id" integer,
    "employee_id" "uuid",
    "comment" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."task_comments_comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."task_comments_comment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_comments_comment_id_seq" OWNED BY "public"."task_comments"."comment_id";



CREATE TABLE IF NOT EXISTS "public"."task_instances" (
    "task_instance_id" integer NOT NULL,
    "task_id" integer,
    "assigned_to_employee_id" "uuid",
    "due_date" timestamp without time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "completion_data" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "task_instances_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'overdue'::"text"])))
);


ALTER TABLE "public"."task_instances" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."task_instances_task_instance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."task_instances_task_instance_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."task_instances_task_instance_id_seq" OWNED BY "public"."task_instances"."task_instance_id";



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "task_id" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "task_type" "text" NOT NULL,
    "frequency" "jsonb",
    "meta_data" "jsonb",
    "created_by_employee_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "tasks_task_type_check" CHECK (("task_type" = ANY (ARRAY['repeated'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tasks_task_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tasks_task_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tasks_task_id_seq" OWNED BY "public"."tasks"."task_id";



CREATE TABLE IF NOT EXISTS "public"."teaching_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_id" "uuid",
    "session_date" "date",
    "status" "text" DEFAULT 'scheduled'::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teaching_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vn_tax_brackets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "min_income" numeric(15,2) NOT NULL,
    "max_income" numeric(15,2),
    "tax_rate" numeric(5,2) NOT NULL,
    "deduction_amount" numeric(15,2) DEFAULT 0,
    "year" integer DEFAULT EXTRACT(year FROM "now"()) NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."vn_tax_brackets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."task_comments" ALTER COLUMN "comment_id" SET DEFAULT "nextval"('"public"."task_comments_comment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."task_instances" ALTER COLUMN "task_instance_id" SET DEFAULT "nextval"('"public"."task_instances_task_instance_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tasks" ALTER COLUMN "task_id" SET DEFAULT "nextval"('"public"."tasks_task_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_clock_ins"
    ADD CONSTRAINT "employee_clock_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enums"
    ADD CONSTRAINT "enums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."main_sessions"
    ADD CONSTRAINT "main_sessions_pkey" PRIMARY KEY ("main_session_id");



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_periods"
    ADD CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_employee_id_payroll_period_id_key" UNIQUE ("employee_id", "payroll_period_id");



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("comment_id");



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_pkey" PRIMARY KEY ("task_instance_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("task_id");



ALTER TABLE ONLY "public"."teaching_sessions"
    ADD CONSTRAINT "teaching_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vn_tax_brackets"
    ADD CONSTRAINT "vn_tax_brackets_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_classes_current_unit" ON "public"."classes" USING "btree" ("current_unit");



CREATE INDEX "idx_employees_email" ON "public"."employees" USING "btree" ((("data" ->> 'email'::"text"))) WHERE (("data" ->> 'email'::"text") IS NOT NULL);



CREATE UNIQUE INDEX "idx_employees_user_id" ON "public"."employees" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_employees_user_id_lookup" ON "public"."employees" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_finances_category" ON "public"."finances" USING "btree" ("category");



CREATE INDEX "idx_finances_due_date" ON "public"."finances" USING "btree" ("due_date");



CREATE INDEX "idx_finances_invoice_id" ON "public"."finances" USING "btree" ("invoice_id");



CREATE INDEX "idx_finances_is_income" ON "public"."finances" USING "btree" ("is_income");



CREATE INDEX "idx_finances_payment_method" ON "public"."finances" USING "btree" ("payment_method");



CREATE INDEX "idx_finances_status" ON "public"."finances" USING "btree" ("status");



CREATE INDEX "idx_instances_completion_gin" ON "public"."task_instances" USING "gin" ("completion_data");



CREATE INDEX "idx_invoice_items_category" ON "public"."invoice_items" USING "btree" ("category");



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_payments_invoice_id" ON "public"."invoice_payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_payments_payment_date" ON "public"."invoice_payments" USING "btree" ("payment_date");



CREATE INDEX "idx_invoices_class_id" ON "public"."invoices" USING "btree" ("class_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_employee_id" ON "public"."invoices" USING "btree" ("employee_id");



CREATE INDEX "idx_invoices_facility_id" ON "public"."invoices" USING "btree" ("facility_id");



CREATE INDEX "idx_invoices_invoice_number" ON "public"."invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_student_id" ON "public"."invoices" USING "btree" ("student_id");



CREATE INDEX "idx_payment_schedules_due_date" ON "public"."payment_schedules" USING "btree" ("due_date");



CREATE INDEX "idx_payment_schedules_student" ON "public"."payment_schedules" USING "btree" ("student_id");



CREATE INDEX "idx_payroll_periods_dates" ON "public"."payroll_periods" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_payroll_records_employee_period" ON "public"."payroll_records" USING "btree" ("employee_id", "payroll_period_id");



CREATE INDEX "idx_payroll_records_invoice" ON "public"."payroll_records" USING "btree" ("invoice_id");



CREATE INDEX "idx_task_instances_assigned_to" ON "public"."task_instances" USING "btree" ("assigned_to_employee_id");



CREATE INDEX "idx_task_instances_due_date" ON "public"."task_instances" USING "btree" ("due_date");



CREATE INDEX "idx_task_instances_status" ON "public"."task_instances" USING "btree" ("status");



CREATE INDEX "idx_tasks_frequency_gin" ON "public"."tasks" USING "gin" ("frequency");



CREATE INDEX "idx_tasks_metadata_gin" ON "public"."tasks" USING "gin" ("meta_data");



CREATE OR REPLACE TRIGGER "trigger_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_employees_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_payment_delete_update_invoice" AFTER DELETE ON "public"."invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_payment_status"();



CREATE OR REPLACE TRIGGER "trigger_payment_insert_update_invoice" AFTER INSERT ON "public"."invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_payment_status"();



CREATE OR REPLACE TRIGGER "trigger_payment_update_update_invoice" AFTER UPDATE ON "public"."invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_payment_status"();



CREATE OR REPLACE TRIGGER "trigger_set_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_number"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_payments_updated_at" BEFORE UPDATE ON "public"."invoice_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_payments_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_totals_finances_insert" AFTER INSERT ON "public"."finances" FOR EACH ROW WHEN (("new"."invoice_id" IS NOT NULL)) EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_totals_finances_update" AFTER UPDATE ON "public"."finances" FOR EACH ROW WHEN ((("new"."invoice_id" IS NOT NULL) OR ("old"."invoice_id" IS NOT NULL))) EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_totals_items_delete" AFTER DELETE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_totals_items_insert" AFTER INSERT ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "trigger_update_invoice_totals_items_update" AFTER UPDATE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_invoice_totals"();



CREATE OR REPLACE TRIGGER "update_invoice_items_updated_at" BEFORE UPDATE ON "public"."invoice_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_schedules_updated_at" BEFORE UPDATE ON "public"."payment_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payroll_periods_updated_at" BEFORE UPDATE ON "public"."payroll_periods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payroll_records_updated_at" BEFORE UPDATE ON "public"."payroll_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_task_instances_updated_at" BEFORE UPDATE ON "public"."task_instances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_from_facility_id_fkey" FOREIGN KEY ("from_facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."asset_transfers"
    ADD CONSTRAINT "asset_transfers_to_facility_id_fkey" FOREIGN KEY ("to_facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."employee_clock_ins"
    ADD CONSTRAINT "employee_clock_ins_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id");



ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."main_sessions"
    ADD CONSTRAINT "lessons_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_schedules"
    ADD CONSTRAINT "payment_schedules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payroll_records"
    ADD CONSTRAINT "payroll_records_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests"
    ADD CONSTRAINT "requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_main_session_id_fkey" FOREIGN KEY ("main_session_id") REFERENCES "public"."main_sessions"("main_session_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id");



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_teaching_session_id_fkey" FOREIGN KEY ("teaching_session_id") REFERENCES "public"."teaching_sessions"("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_instance_id_fkey" FOREIGN KEY ("task_instance_id") REFERENCES "public"."task_instances"("task_instance_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_assigned_to_employee_id_fkey" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("task_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teaching_sessions"
    ADD CONSTRAINT "teaching_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



CREATE POLICY "Allow public delete access on admissions" ON "public"."admissions" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on assets" ON "public"."assets" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on attendance" ON "public"."attendance" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on classes" ON "public"."classes" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on employees" ON "public"."employees" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on enrollments" ON "public"."enrollments" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on evaluations" ON "public"."evaluations" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on facilities" ON "public"."facilities" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on finances" ON "public"."finances" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on payroll" ON "public"."payroll" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on student_assignments" ON "public"."student_assignments" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on students" ON "public"."students" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on teaching_sessions" ON "public"."teaching_sessions" FOR DELETE USING (true);



CREATE POLICY "Allow public insert access on admissions" ON "public"."admissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on assets" ON "public"."assets" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on attendance" ON "public"."attendance" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on classes" ON "public"."classes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on employees" ON "public"."employees" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on enrollments" ON "public"."enrollments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on evaluations" ON "public"."evaluations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on facilities" ON "public"."facilities" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on finances" ON "public"."finances" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on payroll" ON "public"."payroll" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on student_assignments" ON "public"."student_assignments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on students" ON "public"."students" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on teaching_sessions" ON "public"."teaching_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access on admissions" ON "public"."admissions" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on assets" ON "public"."assets" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on attendance" ON "public"."attendance" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on classes" ON "public"."classes" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on employees" ON "public"."employees" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on enrollments" ON "public"."enrollments" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on evaluations" ON "public"."evaluations" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on facilities" ON "public"."facilities" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on finances" ON "public"."finances" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on payroll" ON "public"."payroll" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on student_assignments" ON "public"."student_assignments" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on students" ON "public"."students" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on teaching_sessions" ON "public"."teaching_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public update access on admissions" ON "public"."admissions" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on assets" ON "public"."assets" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on attendance" ON "public"."attendance" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on classes" ON "public"."classes" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on employees" ON "public"."employees" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on enrollments" ON "public"."enrollments" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on evaluations" ON "public"."evaluations" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on facilities" ON "public"."facilities" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on finances" ON "public"."finances" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on payroll" ON "public"."payroll" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on student_assignments" ON "public"."student_assignments" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on students" ON "public"."students" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on teaching_sessions" ON "public"."teaching_sessions" FOR UPDATE USING (true);



CREATE POLICY "Users can delete invoice payments" ON "public"."invoice_payments" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert invoice payments" ON "public"."invoice_payments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update invoice payments" ON "public"."invoice_payments" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update own employee data" ON "public"."employees" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view all invoice payments" ON "public"."invoice_payments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can view own employee record" ON "public"."employees" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."facilities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teaching_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."calculate_vietnamese_income_tax"("taxable_income" numeric, "dependents" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_vietnamese_income_tax"("taxable_income" numeric, "dependents" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_vietnamese_income_tax"("taxable_income" numeric, "dependents" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_vietnamese_social_insurance"("gross_salary" numeric, "insurance_base" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_vietnamese_social_insurance"("gross_salary" numeric, "insurance_base" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_vietnamese_social_insurance"("gross_salary" numeric, "insurance_base" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payroll_invoice"("p_payroll_record_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payroll_invoice"("p_payroll_record_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payroll_invoice"("p_payroll_record_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_sample_invoice_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_sample_invoice_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_sample_invoice_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_task_instances"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_task_instances"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_task_instances"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_by_email"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_by_email"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_by_email"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_by_user_id"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_by_user_id"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_by_user_id"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_type_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_type_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_type_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_finance_category_labels"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_finance_category_labels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_finance_category_labels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_method_labels"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_method_labels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_method_labels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_task_statistics"("employee_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_task_statistics"("employee_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_task_statistics"("employee_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_upcoming_tasks"("days_ahead" integer, "employee_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_upcoming_tasks"("days_ahead" integer, "employee_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_upcoming_tasks"("days_ahead" integer, "employee_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employees_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_employees_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employees_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invoice_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invoice_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invoice_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invoice_payments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invoice_payments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invoice_payments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invoice_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invoice_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invoice_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."admissions" TO "anon";
GRANT ALL ON TABLE "public"."admissions" TO "authenticated";
GRANT ALL ON TABLE "public"."admissions" TO "service_role";



GRANT ALL ON TABLE "public"."asset_transfers" TO "anon";
GRANT ALL ON TABLE "public"."asset_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."employee_clock_ins" TO "anon";
GRANT ALL ON TABLE "public"."employee_clock_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_clock_ins" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."enums" TO "anon";
GRANT ALL ON TABLE "public"."enums" TO "authenticated";
GRANT ALL ON TABLE "public"."enums" TO "service_role";



GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."facilities" TO "anon";
GRANT ALL ON TABLE "public"."facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."facilities" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."finances" TO "anon";
GRANT ALL ON TABLE "public"."finances" TO "authenticated";
GRANT ALL ON TABLE "public"."finances" TO "service_role";



GRANT ALL ON TABLE "public"."finances_backup" TO "anon";
GRANT ALL ON TABLE "public"."finances_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."finances_backup" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."main_sessions" TO "anon";
GRANT ALL ON TABLE "public"."main_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."main_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."payment_schedules" TO "anon";
GRANT ALL ON TABLE "public"."payment_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."payroll" TO "anon";
GRANT ALL ON TABLE "public"."payroll" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_periods" TO "anon";
GRANT ALL ON TABLE "public"."payroll_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_periods" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_records" TO "anon";
GRANT ALL ON TABLE "public"."payroll_records" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_records" TO "service_role";



GRANT ALL ON TABLE "public"."requests" TO "anon";
GRANT ALL ON TABLE "public"."requests" TO "authenticated";
GRANT ALL ON TABLE "public"."requests" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."student_assignments" TO "anon";
GRANT ALL ON TABLE "public"."student_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."student_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_comments_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_comments_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_comments_comment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."task_instances" TO "anon";
GRANT ALL ON TABLE "public"."task_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."task_instances" TO "service_role";



GRANT ALL ON SEQUENCE "public"."task_instances_task_instance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."task_instances_task_instance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."task_instances_task_instance_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tasks_task_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tasks_task_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tasks_task_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teaching_sessions" TO "anon";
GRANT ALL ON TABLE "public"."teaching_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."teaching_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."vn_tax_brackets" TO "anon";
GRANT ALL ON TABLE "public"."vn_tax_brackets" TO "authenticated";
GRANT ALL ON TABLE "public"."vn_tax_brackets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
