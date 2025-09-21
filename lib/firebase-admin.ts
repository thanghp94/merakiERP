import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin
let adminApp
if (!getApps().length) {
  // In production, use service account
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'merakierp',
    })
  } else {
    // In development, use default credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'merakierp',
    })
  }
} else {
  adminApp = getApps()[0]
}

// Initialize Admin SDK services
const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

export { adminDb, adminAuth, adminApp }

// Collection names constants
export const COLLECTIONS = {
  FACILITIES: 'facilities',
  CLASSES: 'classes',
  STUDENTS: 'students',
  EMPLOYEES: 'employees',
  ENROLLMENTS: 'enrollments',
  MAIN_SESSIONS: 'main_sessions',
  SESSIONS: 'sessions',
  ATTENDANCE: 'attendance',
  FINANCES: 'finances',
  TASKS: 'tasks',
} as const

// Subcollection names constants
export const SUBCOLLECTIONS = {
  CLASSES: 'classes',
  ENROLLMENTS: 'enrollments',
  MAIN_SESSIONS: 'main_sessions',
  SESSIONS: 'sessions',
  ATTENDANCE: 'attendance',
  FINANCES: 'finances',
  TASKS: 'tasks',
} as const

// Helper function to get timestamp
export const getTimestamp = () => new Date().toISOString()

// Helper function to verify user authentication and get user info
export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'student', // Default role
      },
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return {
      success: false,
      error: 'Invalid token',
    }
  }
}

// Helper function to set custom claims (roles)
export async function setUserRole(uid: string, role: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role })
    return { success: true }
  } catch (error) {
    console.error('Failed to set user role:', error)
    return { success: false, error: error.message }
  }
}

// Firebase Admin wrapper for common operations
export class FirebaseAdmin {
  static async createDocument(collection: string, data: any, customId?: string) {
    try {
      const docData = {
        ...data,
        created_at: getTimestamp(),
        updated_at: getTimestamp(),
      }
      
      if (customId) {
        await adminDb.collection(collection).doc(customId).set(docData)
        return { success: true, id: customId, data: docData }
      } else {
        const docRef = await adminDb.collection(collection).add(docData)
        return { success: true, id: docRef.id, data: docData }
      }
    } catch (error) {
      console.error('Create document error:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateDocument(collection: string, id: string, data: any) {
    try {
      const updateData = {
        ...data,
        updated_at: getTimestamp(),
      }
      
      await adminDb.collection(collection).doc(id).update(updateData)
      return { success: true, data: updateData }
    } catch (error) {
      console.error('Update document error:', error)
      return { success: false, error: error.message }
    }
  }

  static async deleteDocument(collection: string, id: string) {
    try {
      await adminDb.collection(collection).doc(id).delete()
      return { success: true }
    } catch (error) {
      console.error('Delete document error:', error)
      return { success: false, error: error.message }
    }
  }

  static async getDocument(collection: string, id: string) {
    try {
      const doc = await adminDb.collection(collection).doc(id).get()
      if (!doc.exists) {
        return { success: false, error: 'Document not found' }
      }
      return { success: true, data: { id: doc.id, ...doc.data() } }
    } catch (error) {
      console.error('Get document error:', error)
      return { success: false, error: error.message }
    }
  }

  static async getCollection(collection: string, filters: any = {}) {
    try {
      let query = adminDb.collection(collection)

      // Apply filters
      if (filters.where) {
        filters.where.forEach(([field, operator, value]) => {
          query = query.where(field, operator, value)
        })
      }

      if (filters.orderBy) {
        query = query.orderBy(filters.orderBy.field, filters.orderBy.direction || 'asc')
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.offset(filters.offset)
      }

      const snapshot = await query.get()
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return { success: true, data: documents }
    } catch (error) {
      console.error('Get collection error:', error)
      return { success: false, error: error.message }
    }
  }
}