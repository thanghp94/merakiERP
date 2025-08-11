import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export interface AuthContext {
  user: AuthUser;
  supabase: typeof supabase;
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
 * Extract user information from JWT token
 */
export async function getUserFromRequest(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || ROLES.STUDENT,
      full_name: user.user_metadata?.full_name
    };
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

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
 * Middleware to protect API routes with authentication
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const user = await getUserFromRequest(req);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Create authenticated Supabase client
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      
      const authenticatedSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );

      const context: AuthContext = {
        user,
        supabase: authenticatedSupabase
      };

      await handler(req, res, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

/**
 * Middleware to protect API routes with role-based access control
 */
export function withRoles(
  requiredRoles: Role[],
  handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>
) {
  return withAuth(async (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => {
    const { user } = context;
    
    if (!hasAnyRole(user.role as Role, requiredRoles)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`
      });
    }

    await handler(req, res, context);
  });
}

/**
 * Middleware for admin-only routes
 */
export function withAdminOnly(
  handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>
) {
  return withRoles([ROLES.ADMIN], handler);
}

/**
 * Middleware for teacher and admin routes
 */
export function withTeacherOrAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>
) {
  return withRoles([ROLES.TEACHER, ROLES.ADMIN], handler);
}

/**
 * Middleware for TA, teacher, and admin routes
 */
export function withTAOrHigher(
  handler: (req: NextApiRequest, res: NextApiResponse, context: AuthContext) => Promise<void>
) {
  return withRoles([ROLES.TA, ROLES.TEACHER, ROLES.ADMIN], handler);
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
 * Utility to get user's accessible student IDs
 * - Students can only access their own data
 * - Teachers and admins can access all students
 */
export async function getAccessibleStudentIds(
  context: AuthContext
): Promise<string[] | 'all'> {
  const { user } = context;
  
  if (hasRole(user.role as Role, ROLES.TEACHER)) {
    return 'all'; // Teachers and admins can access all students
  }
  
  if (user.role === ROLES.STUDENT) {
    return [user.id]; // Students can only access their own data
  }
  
  return []; // TAs might have specific access rules
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
