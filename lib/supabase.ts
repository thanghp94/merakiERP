import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set in environment variables')
  console.log('📝 Please check your .env.local file')
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables')
  console.log('📝 Please check your .env.local file')
}

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configuration loaded successfully')
  console.log('🔗 URL:', supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
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
  data: {
    end_date?: string
    level?: string
    max_students?: number
    schedule?: {
      days: string[]
      time: string
    }
    instructor_id?: string
    description?: string
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
