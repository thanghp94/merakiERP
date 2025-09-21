import { FirebaseAdmin, COLLECTIONS } from '@/lib/firebase-admin';
import type { Student } from '@/lib/firebase';

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
  const result = await FirebaseAdmin.createDocument(COLLECTIONS.STUDENTS, {
    ...studentData,
    status: 'active'
  });

  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Get all students with optional filters
export async function getStudents(filters?: {
  status?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const firestoreFilters: any = {
    orderBy: { field: 'created_at', direction: 'desc' }
  };

  const whereConditions: any[] = [];

  if (filters?.status) {
    whereConditions.push(['status', '==', filters.status]);
  }

  if (filters?.level) {
    whereConditions.push(['data.level', '==', filters.level]);
  }

  if (whereConditions.length > 0) {
    firestoreFilters.where = whereConditions;
  }

  if (filters?.limit) {
    firestoreFilters.limit = filters.limit;
  }

  if (filters?.offset) {
    firestoreFilters.offset = filters.offset;
  }

  const result = await FirebaseAdmin.getCollection(COLLECTIONS.STUDENTS, firestoreFilters);

  if (!result.success) throw new Error(result.error);

  let data = result.data || [];

  // Apply search filter client-side since Firestore doesn't support LIKE queries
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    data = data.filter((student: any) => 
      student.full_name?.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm)
    );
  }

  return data;
}

// Get a single student by ID
export async function getStudentById(id: string) {
  const result = await FirebaseAdmin.getDocument(COLLECTIONS.STUDENTS, id);

  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Update a student
export async function updateStudent(id: string, updates: UpdateStudentData) {
  const result = await FirebaseAdmin.updateDocument(COLLECTIONS.STUDENTS, id, updates);

  if (!result.success) throw new Error(result.error);
  
  // Get the updated document
  const updatedDoc = await FirebaseAdmin.getDocument(COLLECTIONS.STUDENTS, id);
  if (!updatedDoc.success) throw new Error(updatedDoc.error);
  
  return updatedDoc.data;
}

// Delete a student (soft delete by setting status to inactive)
export async function deleteStudent(id: string) {
  const result = await FirebaseAdmin.updateDocument(COLLECTIONS.STUDENTS, id, { status: 'inactive' });

  if (!result.success) throw new Error(result.error);
  
  // Get the updated document
  const updatedDoc = await FirebaseAdmin.getDocument(COLLECTIONS.STUDENTS, id);
  if (!updatedDoc.success) throw new Error(updatedDoc.error);
  
  return updatedDoc.data;
}

// Get student statistics
export async function getStudentStats() {
  // Get total students
  const totalResult = await FirebaseAdmin.getCollection(COLLECTIONS.STUDENTS, {});
  if (!totalResult.success) throw new Error(totalResult.error);

  // Get active students
  const activeResult = await FirebaseAdmin.getCollection(COLLECTIONS.STUDENTS, {
    where: [['status', '==', 'active']]
  });
  if (!activeResult.success) throw new Error(activeResult.error);

  // Get today's enrollments
  const today = new Date().toISOString().split('T')[0];
  const todayResult = await FirebaseAdmin.getCollection(COLLECTIONS.STUDENTS, {
    where: [['created_at', '>=', today]]
  });
  if (!todayResult.success) throw new Error(todayResult.error);

  return {
    total: totalResult.data?.length || 0,
    active: activeResult.data?.length || 0,
    todayEnrollments: todayResult.data?.length || 0
  };
}
