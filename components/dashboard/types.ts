export type TabType = 'facilities' | 'classes' | 'employees' | 'students' | 'sessions' | 'attendance' | 'finances' | 'tasks' | 'schedule' | 'api-test';

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
