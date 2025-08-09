import { supabase } from '../supabase';
import type { Student } from '../supabase';

export interface CreateStudentData {
  full_name: string;
  email?: string;
  phone?: string;
  data: {
    date_of_birth?: string;
    address?: string;
    emergency_contact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    parent: {
      name: string;
      phone: string;
      email?: string;
    };
    level?: string;
    notes?: string;
  };
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: 'active' | 'inactive' | 'graduated' | 'suspended';
}

// Create a new student
export async function createStudent(studentData: CreateStudentData) {
  const { data, error } = await supabase
    .from('students')
    .insert({
      ...studentData,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all students with optional filters
export async function getStudents(filters?: {
  status?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.level) {
    query = query.eq('data->level', filters.level);
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get a single student by ID
export async function getStudentById(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Update a student
export async function updateStudent(id: string, updates: UpdateStudentData) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a student (soft delete by setting status to inactive)
export async function deleteStudent(id: string) {
  const { data, error } = await supabase
    .from('students')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get student statistics
export async function getStudentStats() {
  const { data: totalStudents, error: totalError } = await supabase
    .from('students')
    .select('id', { count: 'exact' });

  const { data: activeStudents, error: activeError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .eq('status', 'active');

  const { data: todayEnrollments, error: todayError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (totalError || activeError || todayError) {
    throw totalError || activeError || todayError;
  }

  return {
    total: totalStudents?.length || 0,
    active: activeStudents?.length || 0,
    todayEnrollments: todayEnrollments?.length || 0
  };
}
