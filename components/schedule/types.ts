export interface Session {
  id: string;
  lesson_id: number;
  subject_type: string;
  teacher_id: string;
  teaching_assistant_id?: string;
  location_id?: string;
  start_time: string;
  end_time: string;
  date?: string;
  data?: any;
  // Relations
  main_sessions?: {
    main_session_id: number;
    main_session_name: string;
    scheduled_date: string;
    class_id: string;
    classes?: {
      id: string;
      class_name: string;
      data?: {
        program_type?: string;
      };
    };
  };
  employees_teacher?: {
    id: string;
    full_name: string;
  };
  employees_assistant?: {
    id: string;
    full_name: string;
  };
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
}

export interface ClassScheduleViewProps {
  classId?: string;
}

export type ViewMode = 'day' | 'week';

export interface OverlapGroup {
  [key: string]: Session[];
}
