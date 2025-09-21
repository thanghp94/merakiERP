import { User } from 'firebase/auth';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

// Role hierarchy - higher roles include permissions of lower roles
export const ROLES = {
  STUDENT: 'student',
  TA: 'ta',
  TEACHER: 'teacher',
  ADMIN: 'admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role hierarchy mapping
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.STUDENT]: [ROLES.STUDENT],
  [ROLES.TA]: [ROLES.STUDENT, ROLES.TA],
  [ROLES.TEACHER]: [ROLES.STUDENT, ROLES.TA, ROLES.TEACHER],
  [ROLES.ADMIN]: [ROLES.STUDENT, ROLES.TA, ROLES.TEACHER, ROLES.ADMIN]
};

/**
 * Check if a user has the required role or higher
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const userPermissions = ROLE_HIERARCHY[userRole] || [ROLES.STUDENT];
  return userPermissions.includes(requiredRole);
}

/**
 * Check if a user has any of the required roles
 */
export function hasAnyRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some(role => hasRole(userRole, role));
}

/**
 * Extract user information from Firebase user object
 */
export function getUserFromFirebaseUser(firebaseUser: User | null): AuthUser | null {
  if (!firebaseUser) return null;
  
  // Extract custom claims from Firebase user
  // Note: In a real app, you'd get this from the ID token claims
  const customClaims = (firebaseUser as any).customClaims || {};
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    role: customClaims.role || ROLES.STUDENT,
    full_name: firebaseUser.displayName || undefined
  };
}

/**
 * Check if user owns a resource (for student access control)
 */
export function checkResourceOwnership(
  userId: string,
  resourceUserId: string | null | undefined
): boolean {
  return userId === resourceUserId;
}

/**
 * Utility to filter data based on user permissions
 */
export function filterDataByPermissions<T extends { student_id?: string; user_id?: string }>(
  data: T[],
  user: AuthUser,
  idField: 'student_id' | 'user_id' = 'student_id'
): T[] {
  if (hasRole(user.role as Role, ROLES.TEACHER)) {
    return data; // Teachers and admins see all data
  }
  
  if (user.role === ROLES.STUDENT) {
    return data.filter(item => item[idField] === user.id);
  }
  
  return data; // Default: return all (can be customized per use case)
}