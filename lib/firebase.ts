import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'merakierp',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'merakierp.firebaseapp.com',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'merakierp.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Validate environment variables
if (!firebaseConfig.apiKey) {
  console.error('❌ NEXT_PUBLIC_FIREBASE_API_KEY is not set in environment variables')
  console.log('📝 Please check your .env.local file')
}

if (!firebaseConfig.authDomain) {
  console.error('❌ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set in environment variables')
  console.log('📝 Please check your .env.local file')
}

if (firebaseConfig.apiKey && firebaseConfig.authDomain) {
  console.log('✅ Firebase configuration loaded successfully')
  console.log('🔗 Project ID:', firebaseConfig.projectId)
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore
const db = getFirestore(app)

// Initialize Auth
const auth = getAuth(app)

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9098');
    console.log('🔧 Connected to Firebase Auth emulator');
  } catch (error) {
    console.log('⚠️ Auth emulator might already be connected:', error.message);
  }
  
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8088);
    console.log('🔧 Connected to Firestore emulator');
  } catch (error) {
    console.log('⚠️ Firestore emulator might already be connected:', error.message);
  }
}

export { db, auth }
export default app

// Database types for TypeScript (matching existing Supabase types)
export interface Student {
  id: string
  full_name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  data: {
    date_of_birth?: string
    address?: string
    emergency_contact?: {
      name: string
      phone: string
      relationship: string
    }
    level?: string
    notes?: string
    expected_campus?: string
    program?: string
    student_description?: string
    current_english_level?: string
    parent?: {
      name: string
      phone: string
      email?: string
    }
  }
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  class_name: string
  facility_id: string
  status: 'active' | 'inactive' | 'completed'
  start_date: string
  current_unit?: string
  data: {
    program_type?: string
    unit?: string
    end_date?: string
    level?: string
    max_students?: number
    duration?: string
    schedule?: string | {
      days: string[]
      time: string
    }
    instructor_id?: string
    description?: string
    unit_transitions?: Array<{
      from_unit: string
      to_unit: string
      transition_date: string
      created_at: string
    }>
  }
  facilities?: {
    id: string
    name: string
    status: string
  }
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  enrollment_date: string
  status: 'active' | 'completed' | 'dropped' | 'transferred'
  data: {
    payment_status?: 'paid' | 'pending' | 'partial'
    enrollment_fee?: number
    notes?: string
    completion_date?: string
  }
  created_at: string
  updated_at: string
}

export interface Facility {
  id: string
  name: string
  status: 'active' | 'inactive'
  data: {
    address?: string
    capacity?: number
    contact_info?: {
      phone?: string
      email?: string
    }
    amenities?: string[]
  }
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  full_name: string
  email: string
  phone: string
  position: string
  status: 'active' | 'inactive' | 'terminated'
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MainSession {
  main_session_id: string
  main_session_name: string
  scheduled_date: string
  is_active: boolean
  class_id: string
  lesson_id: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  lesson_id: number
  subject_type: string
  teacher_id: string
  location_id: string
  start_time: string
  end_time: string
  teaching_assistant_id: string
  date: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  enrollment_id: string
  main_session_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Finance {
  id: string
  student_id: string
  amount: number
  transaction_type: 'payment' | 'refund' | 'fee' | 'discount'
  transaction_date: string
  status: 'pending' | 'completed' | 'cancelled'
  description: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  assigned_to: string
  due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  data: Record<string, any>
  created_at: string
  updated_at: string
}

// Additional interfaces for the advanced branch
export interface Admission {
  id: string
  full_name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'enrolled'
  data: {
    date_of_birth?: string
    address?: string
    program_interest?: string
    english_level?: string
    notes?: string
    source?: string
    follow_up_date?: string
  }
  created_at: string
  updated_at: string
}

export interface ProgramType {
  value: string
  label: string
}

export interface UnitOption {
  value: string
  label: string
}

export interface Invoice {
  id: string
  student_id: string
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  data: {
    description?: string
    payment_method?: string
    notes?: string
    items?: Array<{
      description: string
      amount: number
      quantity?: number
    }>
  }
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  title: string
  description: string
  type: 'leave' | 'expense' | 'overtime' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  employee_id: string
  requested_date: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

// Type definitions for navigation
export type TabType = 'personal' | 'facilities' | 'classes' | 'employees' | 'foreign-teachers' | 'students' | 'tuition' | 'sessions' | 'attendance' | 'finances' | 'payroll' | 'tasks' | 'business-tasks' | 'schedule' | 'admissions' | 'requests' | 'api-test'

export type MainTabType = 'vanhanh' | 'khachhang' | 'taichinh' | 'hcns'

export interface SubTab {
  id: TabType
  label: string
  icon: string
  link?: string
}

export interface MainTab {
  id: MainTabType
  label: string
  icon: string
  subtabs: SubTab[]
}

export interface ApiTestResult {
  endpoint: string
  method: string
  status: number
  data: any
  error?: string
}