export type TabType = 'personal' | 'facilities' | 'classes' | 'employees' | 'students' | 'sessions' | 'attendance' | 'finances' | 'payroll' | 'tasks' | 'business-tasks' | 'schedule' | 'admissions' | 'requests' | 'api-test';

export type MainTabType = 'vanhanh' | 'khachhang' | 'taichinh' | 'hcns';

export interface SubTab {
  id: TabType;
  label: string;
  icon: string;
}

export interface MainTab {
  id: MainTabType;
  label: string;
  icon: string;
  subtabs: SubTab[];
}

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  data: any;
  error?: string;
}

export interface Class {
  id: string;
  class_name: string;
  facility_id: string;
  status: string;
  start_date: string;
  current_unit?: string; // Add the dedicated current_unit column
  created_at: string;
  data: {
    program_type?: string;
    unit?: string;
    duration?: string;
    schedule?: string;
    max_students?: number;
    description?: string;
    unit_transitions?: Array<{
      from_unit: string;
      to_unit: string;
      transition_date: string;
      created_at: string;
    }>;
  };
  facilities?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface Facility {
  id: string;
  name: string;
  status: string;
}

export interface ProgramType {
  value: string;
  label: string;
}

export interface UnitOption {
  value: string;
  label: string;
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  department: string;
  status: string;
  created_at: string;
  data: {
    email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    hire_date?: string;
    salary?: number;
    qualifications?: string;
    notes?: string;
  };
}

export interface Student {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
  data: {
    date_of_birth?: string;
    address?: string;
    expected_campus?: string;
    program?: string;
    student_description?: string;
    current_english_level?: string;
    parent?: {
      name: string;
      phone: string;
      email?: string;
    };
    notes?: string;
  };
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  enrollment_date: string;
  created_at: string;
  data: {
    payment_status?: string;
    notes?: string;
  };
  students?: {
    id: string;
    full_name: string;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  session_date: string;
  status: string;
  created_at: string;
  data: {
    notes?: string;
    late_minutes?: number;
  };
  students?: {
    id: string;
    full_name: string;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

export interface Finance {
  id: string;
  student_id: string;
  type: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  data: {
    description?: string;
    payment_method?: string;
    notes?: string;
  };
  students?: {
    id: string;
    full_name: string;
  };
}

export interface Task {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: string;
  created_at: string;
  data: {
    instructions?: string;
    attachments?: string[];
    points?: number;
  };
  classes?: {
    id: string;
    class_name: string;
  };
}

// Business Task Management System Types
export type BusinessTaskType = 'repeated' | 'custom';
export type TaskInstanceStatus = 'pending' | 'completed' | 'overdue';
export type TaskCategory = 
  | 'giảng_dạy'      // Teaching
  | 'quản_lý'        // Management  
  | 'nhân_sự'        // HR
  | 'hành_chính'     // Administrative
  | 'kế_toán'        // Accounting
  | 'marketing'      // Marketing
  | 'an_ninh'        // Security
  | 'vệ_sinh'        // Cleaning
  | 'liên_hệ_phụ_huynh' // Parent communication
  | 'đánh_giá'       // Assessment
  | 'vật_liệu'       // Materials
  | 'bảo_trì';       // Maintenance

export type TaskPriority = 'cao' | 'trung_bình' | 'thấp'; // High, Medium, Low

export interface BusinessTask {
  task_id: number;
  title: string;
  description?: string;
  task_type: BusinessTaskType;
  frequency?: TaskFrequency;
  meta_data?: TaskMetaData;
  created_by_employee_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    full_name: string;
    position: string;
    data?: any;
  };
}

export interface TaskFrequency {
  repeat: 'daily' | 'weekly' | 'monthly';
  days?: string[]; // For weekly: ["Thứ Hai", "Thứ Năm"]
  day_of_month?: number; // For monthly: 25
  time?: string; // For daily: "18:00"
}

export interface TaskMetaData {
  category?: TaskCategory;
  priority?: TaskPriority;
  estimated_hours?: number;
  estimated_minutes?: number;
  class_id?: string;
  class_name?: string;
  student_name?: string;
  parent_phone?: string;
  urgency?: TaskPriority;
  reason?: string;
  department?: string;
  meeting_type?: string;
  attendees?: string[];
  materials?: string[];
  deadline?: string;
  new_students_count?: number;
  includes?: string[];
  checklist?: string[];
  related_student_id?: number;
  related_parent_id?: number;
  related_class_id?: string;
  [key: string]: any; // Allow additional flexible fields
}

export interface TaskInstance {
  task_instance_id: number;
  task_id: number;
  assigned_to_employee_id?: string;
  due_date: string;
  status: TaskInstanceStatus;
  completion_data?: TaskCompletionData;
  created_at: string;
  updated_at: string;
  task?: BusinessTask;
  assigned_to?: {
    id: string;
    full_name: string;
    position: string;
    data?: any;
  };
}

export interface TaskCompletionData {
  completed_at?: string;
  notes?: string;
  file_links?: string[];
  follow_up_details?: string;
  contact_attempts?: number;
  priority?: TaskPriority;
  [key: string]: any; // Allow additional flexible fields
}

export interface TaskComment {
  comment_id: number;
  task_instance_id: number;
  employee_id?: string;
  comment: string;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
    data?: any;
  };
}

// Task Category Labels (Vietnamese)
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  giảng_dạy: 'Giảng dạy',
  quản_lý: 'Quản lý',
  nhân_sự: 'Nhân sự',
  hành_chính: 'Hành chính',
  kế_toán: 'Kế toán',
  marketing: 'Marketing',
  an_ninh: 'An ninh',
  vệ_sinh: 'Vệ sinh',
  liên_hệ_phụ_huynh: 'Liên hệ phụ huynh',
  đánh_giá: 'Đánh giá',
  vật_liệu: 'Vật liệu',
  bảo_trì: 'Bảo trì'
};

// Task Priority Labels (Vietnamese)
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  cao: 'Cao',
  trung_bình: 'Trung bình',
  thấp: 'Thấp'
};

// Task Status Labels (Vietnamese)
export const TASK_STATUS_LABELS: Record<TaskInstanceStatus, string> = {
  pending: 'Chờ thực hiện',
  completed: 'Đã hoàn thành',
  overdue: 'Quá hạn'
};

// Task Status Colors for UI
export const TASK_STATUS_COLORS: Record<TaskInstanceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

// Task Priority Colors for UI
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  cao: 'bg-red-100 text-red-800',
  trung_bình: 'bg-yellow-100 text-yellow-800',
  thấp: 'bg-green-100 text-green-800'
};

// Task Category Colors for UI
export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  giảng_dạy: 'bg-blue-100 text-blue-800',
  quản_lý: 'bg-purple-100 text-purple-800',
  nhân_sự: 'bg-indigo-100 text-indigo-800',
  hành_chính: 'bg-gray-100 text-gray-800',
  kế_toán: 'bg-green-100 text-green-800',
  marketing: 'bg-pink-100 text-pink-800',
  an_ninh: 'bg-red-100 text-red-800',
  vệ_sinh: 'bg-teal-100 text-teal-800',
  liên_hệ_phụ_huynh: 'bg-orange-100 text-orange-800',
  đánh_giá: 'bg-cyan-100 text-cyan-800',
  vật_liệu: 'bg-amber-100 text-amber-800',
  bảo_trì: 'bg-slate-100 text-slate-800'
};

// Task Statistics Interface
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  by_category?: Record<string, number>;
  completion_rate?: number;
  avg_completion_time?: string;
}

export interface Admission {
  id: string;
  status: 'pending' | 'fanpage_inquiry' | 'zalo_consultation' | 'trial_class' | 'enrolled' | 'follow_up' | 'rejected';
  application_date: string;
  data?: {
    source?: string;
    notes?: string;
    trial_date?: string;
    follow_up_date?: string;
    interested_program?: string;
    budget?: number;
    urgency?: 'low' | 'medium' | 'high';
    zalo_id?: string;
    facebook_profile?: string;
    referral_source?: string;
  };
  created_at: string;
  updated_at: string;
  student_name: string;
  phone: string;
  email?: string;
  parent_name?: string;
  location?: string;
}

// HR Request System Types
export type RequestType = 'nghi_phep' | 'doi_lich' | 'tam_ung' | 'mua_sam_sua_chua';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';

export interface Request {
  request_id: string;
  request_type: RequestType;
  title: string;
  description?: string;
  request_data: RequestData;
  status: RequestStatus;
  created_by_employee_id: string;
  approver_employee_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    full_name: string;
    position: string;
    data: any;
  };
  approver?: {
    id: string;
    full_name: string;
    position: string;
    data: any;
  };
  comments?: RequestComment[];
}

export interface RequestComment {
  comment_id: string;
  request_id: string;
  employee_id: string;
  comment: string;
  created_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
  };
}

// Request Data Types for different request types
export interface RequestData {
  // Common fields
  rejection_reason?: string;
  
  // Nghỉ phép (Leave Request)
  from_date?: string;
  to_date?: string;
  total_days?: number;
  reason?: string;
  
  // Đổi lịch (Schedule Change)
  original_date?: string;
  new_date?: string;
  class_affected?: string;
  
  // Tạm ứng (Advance Payment)
  amount?: number;
  repayment_plan?: string;
  
  // Mua sắm/Sửa chữa (Purchase/Repair)
  item_name?: string;
  estimated_cost?: number;
  vendor?: string;
  
  // Additional flexible fields
  [key: string]: any;
}

// Request Type Labels (Vietnamese)
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  nghi_phep: 'Nghỉ phép',
  doi_lich: 'Đổi lịch',
  tam_ung: 'Tạm ứng',
  mua_sam_sua_chua: 'Mua sắm/Sửa chữa'
};

// Request Status Labels (Vietnamese)
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành'
};

// Request Status Colors for UI
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800'
};
